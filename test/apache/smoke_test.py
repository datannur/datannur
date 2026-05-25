from __future__ import annotations

import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from apache_docker import DIST_DIR, PORT, remove_container, start_container
from runtime_browser_checks import assert_clean_http_navigation


@dataclass(frozen=True)
class Response:
    status: int
    content_type: str
    location: str
    headers: dict[str, str]
    body: str


@dataclass(frozen=True)
class Check:
    path: str
    status: int
    content_type: str | None = None
    host: str | None = None
    location: str | None = None
    headers: dict[str, str] | None = None
    body_contains: tuple[str, ...] = ()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def request(path: str, host: str | None = None) -> Response:
    headers = {"Host": host} if host else {}
    req = urllib.request.Request(f"http://localhost:{PORT}{path}", headers=headers)
    try:
        with OPENER.open(req, timeout=5) as res:
            body = res.read().decode("utf-8", errors="replace")
            return Response(
                status=res.status,
                content_type=res.headers.get("Content-Type", ""),
                location=res.headers.get("Location", ""),
                headers={key.lower(): value for key, value in res.headers.items()},
                body=body,
            )
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        return Response(
            status=error.code,
            content_type=error.headers.get("Content-Type", ""),
            location=error.headers.get("Location", ""),
            headers={key.lower(): value for key, value in error.headers.items()},
            body=body,
        )


def wait_until_ready() -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            if request("/").status in {200, 301}:
                return
        except OSError:
            pass
        time.sleep(0.2)
    sys.exit("ERROR: Apache test server did not become ready")


def assert_check(check: Check) -> None:
    response = request(check.path, check.host)
    label = f"{check.host or 'localhost'} {check.path}"

    if response.status != check.status:
        sys.exit(f"ERROR: {label}: expected {check.status}, got {response.status}")

    if check.content_type and check.content_type not in response.content_type:
        sys.exit(
            f"ERROR: {label}: expected content-type containing "
            f"{check.content_type!r}, got {response.content_type!r}"
        )

    if check.location and response.location != check.location:
        sys.exit(
            f"ERROR: {label}: expected location {check.location!r}, "
            f"got {response.location!r}"
        )

    for header, expected_value in (check.headers or {}).items():
        actual_value = response.headers.get(header.lower(), "")
        if expected_value not in actual_value:
            sys.exit(
                f"ERROR: {label}: expected header {header!r} containing "
                f"{expected_value!r}, got {actual_value!r}"
            )

    for expected_text in check.body_contains:
        if expected_text not in response.body:
            sys.exit(f"ERROR: {label}: expected body containing {expected_text!r}")

    print(f"OK {label}: {response.status} {response.content_type}")


def run_checks(checks: list[Check]) -> None:
    start_container(detached=True)
    wait_until_ready()
    for check in checks:
        assert_check(check)


def spa_entry_markers() -> tuple[str, ...]:
    return (
        '<base href="" />',
        '<div id="app"></div>',
        'data-path="data/db"',
    )


def assert_spa_only_mode() -> None:
    static_dir = DIST_DIR / "data" / "static"
    static_backup_dir = DIST_DIR / "data" / "static.__apache_spa_only__"

    if not static_dir.exists():
        sys.exit("ERROR: data/static not found. Run npm run static-make first.")
    if static_backup_dir.exists():
        sys.exit(f"ERROR: temporary directory already exists: {static_backup_dir}")

    remove_container()
    static_dir.rename(static_backup_dir)
    try:
        run_checks(
            [
                Check(
                    "/",
                    200,
                    "text/html",
                    body_contains=spa_entry_markers(),
                ),
                Check("/data/db/dataset.json", 200, "application/json"),
                Check("/app/assets/icon/icon.ico", 200),
            ]
        )
    finally:
        remove_container()
        static_backup_dir.rename(static_dir)


def assert_missing_static_family_falls_back_to_spa() -> None:
    dataset_dir = DIST_DIR / "data" / "static" / "dataset"
    dataset_backup_dir = DIST_DIR / "data" / "static" / "dataset.__apache_spa_family__"

    if not dataset_dir.exists():
        sys.exit("ERROR: data/static/dataset not found. Run npm run static-make first.")
    if dataset_backup_dir.exists():
        sys.exit(f"ERROR: temporary directory already exists: {dataset_backup_dir}")

    remove_container()
    dataset_dir.rename(dataset_backup_dir)
    try:
        run_checks(
            [
                Check(
                    "/dataset/accident_route",
                    200,
                    "text/html",
                    body_contains=spa_entry_markers(),
                ),
            ]
        )
    finally:
        remove_container()
        dataset_backup_dir.rename(dataset_dir)


def main() -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("ERROR: Playwright is required for Apache browser tests")

    root_checks = [
        Check(
            "/",
            200,
            "text/html",
            body_contains=(
                '<meta app-mode="static">',
                "<title>datannur | Accueil</title>",
                'body page="_index"',
                'id="page-loaded-route-"',
            ),
        ),
        Check("/", 301, host="example.com", location="https://example.com/"),
        Check(
            "/datasets?view=full",
            301,
            host="example.com",
            location="https://example.com/datasets?view=full",
        ),
        Check("/", 200, "text/html", host="localhost"),
        Check("/", 200, "text/html", host="localhost:18088"),
        Check("/", 200, "text/html", host="127.0.0.1"),
        Check("/", 200, "text/html", host="127.0.0.1:18088"),
        Check("/", 200, "text/html", host="[::1]"),
        Check("/", 200, "text/html", host="[::1]:18088"),
        Check(
            "/datasets",
            200,
            "text/html",
            body_contains=(
                "<title>Datasets</title>",
                'body page="datasets"',
                'id="page-loaded-route-datasets"',
            ),
        ),
        Check(
            "/organizations",
            200,
            "text/html",
            body_contains=("<title>Organisations</title>", 'body page="organizations"'),
        ),
        Check(
            "/folders",
            200,
            "text/html",
            body_contains=("<title>Dossiers</title>", 'body page="folders"'),
        ),
        Check(
            "/folder/07-agriculture",
            200,
            "text/html",
            body_contains=(
                "<title>Dossier | 07 - Agriculture et sylviculture</title>",
                'body page="folder"',
            ),
        ),
        Check(
            "/dataset/accident_route",
            200,
            "text/html",
            body_contains=(
                "<title>Dataset | Accidents de la route</title>",
                'body page="dataset"',
                'id="page-loaded-route-dataset___accident_route"',
                "accident_route",
            ),
        ),
        Check(
            "/tag/foret",
            200,
            "text/html",
            body_contains=("<title>Mot clé | Forêt</title>", 'body page="tag"'),
        ),
        Check(
            "/concept/population",
            200,
            "text/html",
            body_contains=(
                "<title>Concept | Population</title>",
                'body page="concept"',
            ),
        ),
        Check(
            "/doc/tourisme-exemple",
            200,
            "text/html",
            body_contains=("<title>Doc | Tourisme exemple</title>", 'body page="doc"'),
        ),
        Check(
            "/variable/unknown",
            200,
            "text/html",
            body_contains=spa_entry_markers(),
        ),
        Check(
            "/enumeration/unknown",
            200,
            "text/html",
            body_contains=spa_entry_markers(),
        ),
        Check(
            "/metaFolder/unknown",
            200,
            "text/html",
            body_contains=spa_entry_markers(),
        ),
        Check(
            "/metaDataset/unknown",
            200,
            "text/html",
            body_contains=spa_entry_markers(),
        ),
        Check(
            "/metaVariable/unknown",
            200,
            "text/html",
            body_contains=spa_entry_markers(),
        ),
        Check("/variable/unknown/app/assets/icon/icon.ico", 200),
        Check(
            "/variable/unknown/data/db/dataset.json",
            200,
            "application/json",
            body_contains=('"id": "accident_route"',),
        ),
        Check(
            "/data/db/dataset.json",
            200,
            "application/json",
            headers={
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET, HEAD, OPTIONS",
                "access-control-allow-headers": "Content-Type",
                "cache-control": "public, max-age=31536000, immutable",
                "x-content-type-options": "nosniff",
            },
        ),
        Check(
            "/data/db/dataset.json.js",
            200,
            "text/javascript",
            body_contains=("jsonjs.data['dataset']", "accident_route"),
        ),
        Check("/data/deploy.config.json", 403),
        Check("/data/llm-web.config.json", 403),
        Check(
            "/data/static-make.config.json",
            200,
            "application/json",
            body_contains=('"appPath"', '"outDir"'),
        ),
        Check("/app/assets/icon/icon.ico", 200),
        Check(
            "/api",
            301,
            location="http://localhost:18088/api/",
        ),
        Check(
            "/api/",
            200,
            "text/html",
            body_contains=("datannur API", "openapi.json"),
        ),
        Check(
            "/api/raw/",
            301,
            location="http://localhost:18088/api/raw",
        ),
        Check(
            "/api/raw",
            200,
            "text/html",
            body_contains=("datannur Raw API", "openapi-raw.json"),
        ),
        Check(
            "/api/dataset?_limit=1",
            200,
            "application/json",
            body_contains=('"id": "accident_route"',),
        ),
        Check(
            "/api/llm/status.php",
            200,
            "application/json",
            body_contains=('"enabled"', '"requiresTurnstile":false', '"siteKey"'),
        ),
        Check("/app/assets/icon/icon.ico", 200),
        Check(
            "/not-a-real-route",
            404,
            "text/html",
            body_contains=("La page n'existe pas", 'body page="_error"'),
        ),
        Check(
            "/notarealcleanpage",
            404,
            "text/html",
            body_contains=("La page n'existe pas", 'body page="_error"'),
        ),
        Check(
            "/dataset/not_existing",
            404,
            "text/html",
            body_contains=("La page n'existe pas", 'body page="_error"'),
        ),
        Check(
            "/data/static/not-a-real-file.html",
            404,
            "text/html",
            body_contains=("La page n'existe pas", 'body page="_error"'),
        ),
    ]

    try:
        run_checks(root_checks)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            assert_clean_http_navigation(browser, f"http://localhost:{PORT}")
            browser.close()
        assert_missing_static_family_falls_back_to_spa()
        assert_spa_only_mode()
    finally:
        remove_container()


if __name__ == "__main__":
    main()
