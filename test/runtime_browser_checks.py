from __future__ import annotations

from urllib.parse import urljoin


def assert_no_hash_url(page, action: str) -> None:
    current_url = page.evaluate("window.location.href")
    if "/#/" in current_url:
        raise AssertionError(f"{action} produced a hash URL: {current_url}")


def assert_clean_http_navigation(browser, base_url: str) -> None:
    page = browser.new_page()
    page.set_default_timeout(10_000)
    page.set_default_navigation_timeout(10_000)
    try:
        page.goto(f"{base_url}/organization/defr", wait_until="networkidle")
        page.wait_for_selector('body[page="organization"]')
        assert_no_hash_url(page, "direct clean route")

        page.goto(f"{base_url}/folder/bevnat", wait_until="networkidle")
        page.wait_for_selector('body[page="folder"]')
        page.wait_for_selector("h1")
        assert_no_hash_url(page, "folder detail clean route")

        page.goto(f"{base_url}/datasets", wait_until="networkidle")
        page.wait_for_selector('body[page="datasets"]')
        page.wait_for_selector("a.tab-select-btn")
        second_tab = page.locator("a.tab-select-btn").nth(1)
        second_tab.click()
        page.wait_for_timeout(300)
        assert_no_hash_url(page, "tab click")

        tag_link = page.locator('a[href$="/tag/anonymous_data"]').first
        href = tag_link.get_attribute("href")
        if not href or "/#/" in href:
            raise AssertionError(f"native link href is not a clean URL: {href}")

        new_page = browser.new_page()
        try:
            new_page.goto(urljoin(base_url, href), wait_until="domcontentloaded")
            new_page.wait_for_selector('body[page="tag"]')
            assert_no_hash_url(new_page, "new tab link click")
        finally:
            new_page.close()

        tag_link.click()
        page.wait_for_selector('body[page="tag"]')
        assert_no_hash_url(page, "native link click")
    finally:
        page.close()
