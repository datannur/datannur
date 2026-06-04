from __future__ import annotations

import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from apache_docker import (
    CONTAINER_NAME,
    DIST_DIR,
    IMAGE,
    PORT,
    ensure_container_runtime,
    remove_container,
)
from runtime_browser_checks import assert_clean_http_navigation

HTTPD_CONF = Path(__file__).resolve().parent / "httpd-subfolder.conf"
BASE_URL = f"http://localhost:{PORT}/datannur"
EN_BASE_URL = f"{BASE_URL}/en"
FR_BASE_URL = f"{BASE_URL}/fr"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def run(command: list[str], quiet: bool = False) -> subprocess.CompletedProcess[str]:
    output = subprocess.DEVNULL if quiet else None
    return subprocess.run(command, check=True, text=True, stdout=output, stderr=output)


def wait_until_ready() -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"{BASE_URL}/", timeout=2) as response:
                if response.status == 200:
                    return
        except OSError:
            pass
        time.sleep(0.2)
    sys.exit("ERROR: Apache subfolder test server did not become ready")


def start_subfolder_container(empty_root: Path) -> None:
    if not DIST_DIR.exists():
        sys.exit("ERROR: dist/ not found. Run npm run static-make first.")

    ensure_container_runtime()
    remove_container()
    run(
        [
            "docker",
            "run",
            "--rm",
            "--name",
            CONTAINER_NAME,
            "-p",
            f"{PORT}:80",
            "-v",
            f"{empty_root}:/var/www/empty-root:ro",
            "-v",
            f"{DIST_DIR}:/var/www/html:ro",
            "-v",
            f"{HTTPD_CONF}:/etc/apache2/sites-available/000-default.conf:ro",
            "-d",
            IMAGE,
            "sh",
            "-c",
            "a2enmod rewrite headers expires deflate && apache2-foreground",
        ],
        quiet=True,
    )
    wait_until_ready()


def assert_page(page, url: str, title: str, body_page: str) -> None:
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_selector(f'body[page="{body_page}"]')
    page.wait_for_selector("h1")
    if page.title() != title:
        sys.exit(f"ERROR: {url}: expected title {title!r}, got {page.title()!r}")


def assert_spa_fallback_page(page, url: str, title: str, body_page: str) -> None:
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_function(
        """([expectedTitle, expectedBodyPage]) =>
            document.title === expectedTitle &&
            document.body.getAttribute('page') === expectedBodyPage
        """,
        arg=[title, body_page],
    )


def assert_generated_html_is_portable() -> None:
    datasets_html = DIST_DIR / "data" / "static" / "en" / "datasets.html"
    tag_html = DIST_DIR / "data" / "static" / "en" / "tag" / "anonymous_data.html"
    fr_index_html = DIST_DIR / "data" / "static" / "fr" / "index.html"
    for html_file in (datasets_html, tag_html):
        html = html_file.read_text(encoding="utf-8")
        if 'href="/tag/' in html or 'href="/datannur/' in html:
            sys.exit(f"ERROR: generated static links are not portable in {html_file}")
    if 'href="/"' in tag_html.read_text(encoding="utf-8"):
        sys.exit("ERROR: generated static homepage link is not portable")
    if 'href="/fr/app/manifest.json' in fr_index_html.read_text(encoding="utf-8"):
        sys.exit("ERROR: generated static manifest link includes language prefix")


def assert_http_response(
    path: str,
    expected_status: int,
    expected_content_type: str | None = None,
    expected_location: str | None = None,
    expected_body: tuple[str, ...] = (),
) -> None:
    req = urllib.request.Request(f"http://localhost:{PORT}{path}")
    try:
        with OPENER.open(req, timeout=5) as response:
            status = response.status
            headers = response.headers
            body = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        status = error.code
        headers = error.headers
        body = error.read().decode("utf-8", errors="replace")

    label = f"localhost {path}"
    if status != expected_status:
        sys.exit(f"ERROR: {label}: expected {expected_status}, got {status}")

    content_type = headers.get("Content-Type", "")
    if expected_content_type and expected_content_type not in content_type:
        sys.exit(
            f"ERROR: {label}: expected content-type containing "
            f"{expected_content_type!r}, got {content_type!r}"
        )

    location = headers.get("Location", "")
    if expected_location and location != expected_location:
        sys.exit(
            f"ERROR: {label}: expected location {expected_location!r}, "
            f"got {location!r}"
        )

    for expected_text in expected_body:
        if expected_text not in body:
            sys.exit(f"ERROR: {label}: expected body containing {expected_text!r}")


def main() -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("ERROR: Playwright is required for Apache subfolder browser tests")

    with tempfile.TemporaryDirectory(prefix="datannur-apache-empty-root-") as tmp:
        assert_generated_html_is_portable()
        start_subfolder_container(Path(tmp))
        try:
            assert_http_response(
                "/datannur/api",
                301,
                expected_location=f"{BASE_URL}/api/",
            )
            assert_http_response(
                "/datannur/api/",
                200,
                "text/html",
                expected_body=("datannur API", "openapi.json"),
            )
            assert_http_response(
                "/datannur/api/raw/",
                301,
                expected_location=f"{BASE_URL}/api/raw",
            )
            assert_http_response(
                "/datannur/api/raw",
                200,
                "text/html",
                expected_body=("datannur Raw API", "openapi-raw.json"),
            )
            assert_http_response(
                "/datannur/api/dataset?_limit=1",
                200,
                "application/json",
                expected_body=('"id": "accident_route"',),
            )
            assert_http_response(
                "/datannur/api/llm/status.php",
                200,
                "application/json",
                expected_body=('"enabled"', '"requiresTurnstile":false', '"siteKey"'),
            )

            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_default_timeout(10_000)
                page.set_default_navigation_timeout(10_000)

                llm_requests: list[str] = []
                page.on(
                    "request",
                    lambda request: (
                        llm_requests.append(request.url)
                        if "/api/llm/" in request.url
                        else None
                    ),
                )

                assert_page(
                    page,
                    f"{EN_BASE_URL}/tag/anonymous_data",
                    "Tag | Anonymized data",
                    "tag",
                )
                page.reload(wait_until="domcontentloaded")
                page.wait_for_selector('body[page="tag"]')

                home_link = page.locator('a.navbar-item[href="/datannur/en/"]').first
                if home_link.get_attribute("href") != "/datannur/en/":
                    sys.exit("ERROR: static subfolder homepage href is invalid")
                home_link.click()
                page.wait_for_url(f"{EN_BASE_URL}/")
                page.wait_for_selector('body[page="_index"]')

                assert_page(
                    page,
                    f"{FR_BASE_URL}/dataset/accident_route",
                    "Dataset | Accidents de la route",
                    "dataset",
                )

                page.goto(
                    f"{FR_BASE_URL}/tag/data_protection?tab=tags",
                    wait_until="domcontentloaded",
                )
                page.wait_for_function(
                    """() =>
                        document.body.getAttribute('page') === 'tag' &&
                        document.title === 'Mot clé | Protection des données' &&
                        document.querySelector('h1')?.textContent.includes(
                            'Protection des données'
                        )
                    """,
                )

                assert_spa_fallback_page(
                    page,
                    f"{EN_BASE_URL}/variable/usage_internet__connexion_domicile",
                    "Variable | Conn Dom",
                    "variable",
                )
                page.wait_for_selector('a[href^="/datannur/"]', state="attached")
                fallback_hrefs = page.locator('a[href^="/datannur/"]').evaluate_all(
                    "links => links.map(link => link.getAttribute('href'))"
                )
                if any(
                    href and href.startswith("/datannur/#/") for href in fallback_hrefs
                ):
                    sys.exit("ERROR: fallback SPA links use hash URLs under subfolder")
                page.wait_for_selector('a.navbar-item[href="/datannur/en/"]')
                page.locator('a.navbar-item[href="/datannur/en/"]').first.click()
                page.wait_for_function(
                    """expectedUrl =>
                        window.location.href === expectedUrl &&
                        document.body.getAttribute('page') === '_index'
                    """,
                    arg=f"{EN_BASE_URL}/",
                )

                page.goto(f"{EN_BASE_URL}/datasets", wait_until="domcontentloaded")
                page.wait_for_selector('body[page="datasets"]')
                tag_link = page.locator(
                    'a[href="/datannur/en/tag/anonymous_data"]'
                ).first
                if tag_link.get_attribute("href") != "/datannur/en/tag/anonymous_data":
                    sys.exit("ERROR: static subfolder href does not include app base")

                new_page = browser.new_page()
                assert_page(
                    new_page,
                    f"http://localhost:{PORT}{tag_link.get_attribute('href')}",
                    "Tag | Anonymized data",
                    "tag",
                )
                new_page.close()

                tag_link.click()
                page.wait_for_url(f"{EN_BASE_URL}/tag/anonymous_data")
                page.reload(wait_until="domcontentloaded")
                page.wait_for_selector('body[page="tag"]')
                if page.title() != "Tag | Anonymized data":
                    sys.exit(
                        "ERROR: subfolder click/reload kept wrong title "
                        f"{page.title()!r}"
                    )

                page.goto(
                    f"{EN_BASE_URL}/about?tab=aboutStructure",
                    wait_until="domcontentloaded",
                )
                page.wait_for_selector(".simple-diagram-block svg a")
                mermaid_hrefs = page.locator(
                    ".simple-diagram-block svg a"
                ).evaluate_all(
                    """links => links.map(link =>
                        link.getAttribute('href') || link.getAttribute('xlink:href')
                    )"""
                )
                if any(
                    href and href.startswith("/metaDataset/") for href in mermaid_hrefs
                ):
                    sys.exit("ERROR: Mermaid entity links point to site root")
                if not any(
                    href and href.startswith("/datannur/en/metaDataset/")
                    for href in mermaid_hrefs
                ):
                    sys.exit("ERROR: Mermaid entity links do not include app base")

                page.goto(f"{EN_BASE_URL}/", wait_until="domcontentloaded")
                page.get_by_title("Open LLM chat").click()
                page.wait_for_selector(".llm-chat-panel.open")
                page.wait_for_timeout(500)
                if any(
                    "/api/llm/" in url
                    and "/datannur/api/llm/" not in url
                    and "/datannur/en/api/llm/" not in url
                    for url in llm_requests
                ):
                    sys.exit("ERROR: subfolder LLM requests point to site root")
                if not any(
                    "/datannur/en/api/llm/session.php" in url
                    or "/datannur/api/llm/session.php" in url
                    for url in llm_requests
                ):
                    sys.exit("ERROR: subfolder LLM session was not created")

                assert_clean_http_navigation(browser, EN_BASE_URL)
                browser.close()
        finally:
            remove_container()

    print("OK Apache subfolder browser navigation")


if __name__ == "__main__":
    main()
