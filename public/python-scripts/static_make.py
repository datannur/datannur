#!/usr/bin/env python3
"""Generate static HTML pages for datannur with Playwright."""

from __future__ import annotations

import functools
import html
import json
import os
import re
import shutil
import sys
import threading
import time
from dataclasses import dataclass
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote

from _local_runtime import APP_DIR, create_local_http_server

try:
    from playwright.sync_api import Browser, Page, sync_playwright
except ImportError:
    print("ERROR: Missing dependency: playwright")
    print("Install with: python3 -m pip install playwright")
    print("Then install browsers with: python3 -m playwright install chromium")
    sys.exit(1)


DEFAULT_CONFIG_PATH = APP_DIR / "data" / "static-make.config.json"


@dataclass
class StaticMakeConfig:
    domain: str
    index_seo: bool
    app_path: str
    out_dir: str
    db_meta_path: str
    port: int
    entities: list[str]
    routes: list[str]


class SpaRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, directory: str, index_file: str, **kwargs: Any):
        self.index_file = index_file
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args: Any):
        return

    def send_head(self):
        path = self.translate_path(self.path)

        if os.path.isdir(path):
            return super().send_head()

        if not os.path.exists(path):
            path = os.path.join(self.directory, self.index_file)

        if not os.path.isfile(path):
            self.send_error(404, "File not found")
            return None

        try:
            file = open(path, "rb")
            stat = os.stat(path)
        except OSError:
            self.send_error(404, "File not found")
            return None

        self.send_response(200)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Length", str(stat.st_size))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()
        return file


def load_config(config_path: Path) -> StaticMakeConfig:
    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        sys.exit(f"ERROR: Failed to read or parse {config_path}: {error}")

    return StaticMakeConfig(
        domain=str(raw["domain"]),
        index_seo=bool(raw.get("indexSeo", False)),
        app_path=str(raw.get("appPath", ".")),
        out_dir=str(raw.get("outDir", "static")),
        db_meta_path=str(raw["dbMetaPath"]),
        port=int(raw.get("port", 8080)),
        entities=[str(entity) for entity in raw.get("entities", [])],
        routes=[str(route) for route in raw.get("routes", [])],
    )


def array_to_object(data: list[list[Any]]) -> list[dict[str, Any]]:
    if not data:
        return []

    headers, *rows = data
    return [
        {
            str(header): row[index]
            for index, header in enumerate(headers)
            if index < len(row)
        }
        for row in rows
    ]


def get_db_meta_path(output_db: Path) -> Path:
    if not output_db.exists():
        sys.exit(f"ERROR: Database metadata path not found: {output_db}")

    if any(output_db.glob("*.json.js")):
        return output_db

    folders = [item for item in output_db.iterdir() if item.is_dir()]
    if len(folders) == 1:
        return folders[0]

    return output_db


def load_jsonjsdb_file(file_path: Path) -> list[dict[str, Any]]:
    data = file_path.read_text(encoding="utf-8")
    _, _, json_part = data.partition("=")
    parsed = json.loads(json_part.strip()) if json_part else []

    if parsed and isinstance(parsed[0], list):
        return array_to_object(parsed)

    return [item for item in parsed if isinstance(item, dict)]


def get_entity_routes(db_meta_path: Path, entities: list[str]) -> list[str]:
    routes: list[str] = []
    for entity in entities:
        file_path = db_meta_path / f"{entity}.json.js"
        rows = load_jsonjsdb_file(file_path)
        for row in rows:
            row_id = row.get("id")
            if row_id is not None:
                routes.append(f"{entity}/{row_id}")
    return routes


def get_db_path_from_content(content: str) -> str:
    match = re.search(r'id="jsonjsdb-config"[^>]+data-path="([^"]+)"', content)
    return match.group(1) if match else "data/db"


def wait_until_ready(url: str, max_attempts: int = 30, delay_seconds: float = 0.2):
    import urllib.request

    for _ in range(max_attempts):
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if 200 <= response.status < 400:
                    return
        except OSError:
            pass
        time.sleep(delay_seconds)

    raise TimeoutError(f"server not ready at {url}")


def log_phase(label: str, start_time: float):
    elapsed = time.monotonic() - start_time
    print(f"{label}: {elapsed:.2f}s", flush=True)


def create_index_file(source_file: Path, target_file: Path, index_seo: bool):
    index = source_file.read_text(encoding="utf-8")
    index = index.replace('<base href=""', '<base href="/"')
    index = index.replace("<head>", '<head><meta app-mode="static" />')

    if index_seo:
        index = index.replace(
            '<meta name="robots" content="noindex"', '<meta name="robots"'
        )

    target_file.write_text(index, encoding="utf-8")


def remove_db_scripts(content: str, db_path_extractor: Callable[[str], str]) -> str:
    db_path = re.escape(db_path_extractor(content))
    pattern = re.compile(rf'<script src="{db_path}/[^"]+\.json\.js[^"]*"></script>')
    return pattern.sub("", content)


def capture_page(
    page: Page,
    route: str,
    out_dir: Path,
    is_first_page: bool,
    wait_for_db_selector: str,
) -> bool:
    output_path = out_dir / ("index.html" if route == "" else f"{route}.html")
    page.evaluate(
        """route => {
            window.history.pushState({ path: route }, '', route)
            window.dispatchEvent(new PopStateEvent('popstate'))
        }""",
        route,
    )

    try:
        if is_first_page:
            page.wait_for_selector(
                wait_for_db_selector, timeout=30000, state="attached"
            )

        marker = f"#page-loaded-route-{route.replace('/', '___')}"
        page.wait_for_selector(marker, timeout=10000, state="attached")
        content = remove_db_scripts(page.content(), get_db_path_from_content)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        print(f"create page: {route or 'index'}", flush=True)
        return True
    except Exception as error:
        print(f"ERROR: Failed to capture page: {output_path}: {error}", flush=True)
        return False


def calculate_priority(route: str) -> float:
    if route == "":
        return 1.0
    depth = len([part for part in route.split("/") if part])
    return max(0.3, 1.0 - depth * 0.2)


def generate_sitemap(routes: list[str], domain: str, target_file: Path):
    items = []
    for route in routes:
        location = f"{domain.rstrip('/')}/{quote(route)}"
        priority = calculate_priority(route)
        items.append(
            "  <url>"
            f"<loc>{html.escape(location)}</loc>"
            "<changefreq>monthly</changefreq>"
            f"<priority>{priority:.1f}</priority>"
            "</url>"
        )

    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(items)
        + "\n</urlset>\n"
    )
    target_file.write_text(sitemap, encoding="utf-8")


def init_page(browser: Browser, port: int) -> Page:
    page_url = f"http://localhost:{port}"
    wait_until_ready(page_url)
    page = browser.new_page()
    page.set_default_timeout(10000)
    page.goto(page_url)
    return page


def generate_static_site(routes: list[str], config: StaticMakeConfig, app_dir: Path):
    start_time = time.monotonic()
    phase_time = start_time
    index_file = app_dir / "index.html"
    backup_file = app_dir / "index.html.bak"
    out_dir = app_dir / config.out_dir
    server = None
    failures: list[str] = []

    shutil.move(index_file, backup_file)
    create_index_file(backup_file, index_file, config.index_seo)
    log_phase("prepare index", phase_time)
    phase_time = time.monotonic()

    try:
        handler = functools.partial(
            SpaRequestHandler,
            directory=str(app_dir),
            index_file=index_file.name,
        )
        server = create_local_http_server(config.port, handler, "static generation")
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        print(f"Static server on http://localhost:{config.port}", flush=True)
        log_phase("start server", phase_time)
        phase_time = time.monotonic()

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True,
                args=["--disable-dev-shm-usage", "--no-sandbox"],
            )
            log_phase("launch browser", phase_time)
            phase_time = time.monotonic()
            try:
                page = init_page(browser, config.port)
                log_phase("load first page", phase_time)
                phase_time = time.monotonic()
                for index, route in enumerate(routes):
                    ok = capture_page(
                        page,
                        route,
                        out_dir,
                        is_first_page=index == 0,
                        wait_for_db_selector="#db-loaded",
                    )
                    if not ok:
                        failures.append(route or "index")
                log_phase("capture routes", phase_time)
            finally:
                browser.close()
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()
        shutil.move(backup_file, index_file)

    if config.index_seo:
        generate_sitemap(routes, config.domain, app_dir / "sitemap.xml")
        print("Sitemap has been successfully created!", flush=True)

    time_taken = time.monotonic() - start_time
    print(
        f"Static site created {len(routes)} pages in {time_taken:.2f} seconds",
        flush=True,
    )

    if failures:
        sys.exit(
            f"ERROR: Failed to generate {len(failures)} pages: {', '.join(failures)}"
        )


def prepare_output(app_dir: Path, config: StaticMakeConfig):
    out_dir = app_dir / config.out_dir
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    for entity in config.entities:
        (out_dir / entity).mkdir(parents=True, exist_ok=True)


def main():
    config_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CONFIG_PATH
    config = load_config(config_path)
    app_dir = (APP_DIR / config.app_path).resolve()

    prepare_output(app_dir, config)
    db_meta_path = get_db_meta_path(app_dir / config.db_meta_path)
    routes = [*config.routes, *get_entity_routes(db_meta_path, config.entities)]
    generate_static_site(routes, config, app_dir)


if __name__ == "__main__":
    main()
