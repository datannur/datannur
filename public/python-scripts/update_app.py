import hashlib
import json
import re
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from typing import TypedDict, Optional, List
from urllib.response import addinfourl

REPO_PATH = Path(__file__).parent.parent
GITHUB_REPO_API = "https://api.github.com/repos/datannur/datannur/releases"
CONFIG_FILE = REPO_PATH / "data" / "update-app.json"
ASSET_PRE_RELEASE = "datannur-app-pre-release.zip"
ASSET_LATEST = "datannur-app-latest.zip"
MAX_DOWNLOAD_SIZE = 100 * 1024 * 1024  # 100MB
REQUEST_TIMEOUT = 30  # seconds


class Config(TypedDict):
    targetVersion: str
    include: List[str]
    proxyUrl: Optional[str]


class AssetInfo(TypedDict):
    url: str
    sha256: str


SUCCESS = "✅"
ERROR = "❌"
WARNING = "⚠️"


def validate_config_value(
    config: dict, key: str, expected_type: type, required: bool = True
) -> None:
    """Validate a configuration value."""
    if required and key not in config:
        print(f"{ERROR} Missing '{key}' in config file.")
        sys.exit(1)
    value = config.get(key)
    if value is not None and not isinstance(value, expected_type):
        print(f"{ERROR} '{key}' must be a {expected_type.__name__}.")
        sys.exit(1)


def validate_list_items(config: dict, key: str, item_type: type) -> None:
    """Validate that all items in a list have the expected type."""
    if not all(isinstance(item, item_type) for item in config.get(key, [])):
        print(f"{ERROR} All items in '{key}' must be {item_type.__name__}s.")
        sys.exit(1)


def get_config() -> Config:
    if not CONFIG_FILE.exists():
        print(f"{ERROR} Config file '{CONFIG_FILE}' does not exist.")
        sys.exit(1)
    try:
        config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"{ERROR} '{CONFIG_FILE}' is not valid JSON.")
        sys.exit(1)
    validate_config_value(config, "targetVersion", str)
    validate_config_value(config, "include", list)
    validate_config_value(config, "proxyUrl", str, required=False)
    validate_list_items(config, "include", str)
    return config


def make_request(url: str, proxy_url: Optional[str] = None) -> bytes:
    """Make HTTP request with optional proxy and size limit."""

    def read_with_limit(response: addinfourl) -> bytes:
        content_size = response.headers.get("Content-Length")
        if content_size and int(content_size) > MAX_DOWNLOAD_SIZE:
            msg = f"{ERROR} File too large: {content_size} bytes (max: {MAX_DOWNLOAD_SIZE})"
            raise ValueError(msg)

        data = response.read(MAX_DOWNLOAD_SIZE + 1)
        if len(data) > MAX_DOWNLOAD_SIZE:
            msg = f"{ERROR} Downloaded file exceeds size limit: {len(data)} bytes (max: {MAX_DOWNLOAD_SIZE})"
            raise ValueError(msg)
        return data

    if proxy_url:
        proxy_values = {"http": proxy_url, "https": proxy_url}
        proxy_handler = urllib.request.ProxyHandler(proxy_values)
        opener = urllib.request.build_opener(proxy_handler)
        with opener.open(url, timeout=REQUEST_TIMEOUT) as response:
            return read_with_limit(response)

    with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as response:
        return read_with_limit(response)


def verify_file_integrity(file_path: Path, expected_sha256: str) -> bool:
    """Verify downloaded file integrity using SHA256."""
    with open(file_path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    if file_hash != expected_sha256:
        print(f"{ERROR} File integrity check failed!")
        print(f"Expected: {expected_sha256}")
        print(f"Got:      {file_hash}")
        return False

    print(f"{SUCCESS} File integrity verified")
    return True


def get_asset_url(target_version: str, proxy_url: Optional[str] = None) -> AssetInfo:
    """Get download URL and SHA256 for the app asset from GitHub releases."""
    if target_version == "pre-release":
        url = f"{GITHUB_REPO_API}/tags/pre-release"
        asset_name = ASSET_PRE_RELEASE
    elif target_version == "latest":
        url = f"{GITHUB_REPO_API}/latest"
        asset_name = ASSET_LATEST
    else:
        url = f"{GITHUB_REPO_API}/tags/v{target_version}"
        asset_name = ASSET_LATEST
    try:
        response_data = make_request(url, proxy_url)
        release_data = json.loads(response_data.decode())
    except urllib.error.URLError as e:
        print(f"{ERROR} Failed to fetch release data: {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"{ERROR} API response size error: {e}")
        sys.exit(1)

    for asset in release_data.get("assets", []):
        if asset["name"] == asset_name:
            digest = asset.get("digest", "")
            sha256_hash = digest[7:] if digest.startswith("sha256:") else ""
            return {"url": asset["browser_download_url"], "sha256": sha256_hash}

    print(f"Asset {asset_name} not found in release")
    sys.exit(1)


def download_and_extract(
    asset_info: AssetInfo, temp_dir: Path, proxy_url: Optional[str] = None
) -> bool:
    """Download and extract app package with integrity verification."""
    zip_url = asset_info["url"]
    expected_sha256 = asset_info["sha256"]
    filename = zip_url.split("/")[-1]
    zip_file_path = temp_dir / filename

    if not expected_sha256:
        print(f"{ERROR} No SHA256 available for verification. Aborting for security.")
        return False

    try:
        file_data = make_request(zip_url, proxy_url)
    except urllib.error.URLError as e:
        print(f"{ERROR} Failed to download {filename}: {e}")
        return False
    except ValueError as e:
        print(f"{ERROR} Download size error: {e}")
        return False

    zip_file_path.write_bytes(file_data)
    print(f"{SUCCESS} Downloaded {filename}")

    if not verify_file_integrity(zip_file_path, expected_sha256):
        print(f"{ERROR} Download integrity check failed. Aborting update.")
        return False

    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
        zip_ref.extractall(temp_dir)
    print(f"{SUCCESS} Extracted to {temp_dir}")
    return True


def copy_files(source_dir: Path, files_to_copy: List[str]) -> None:
    """Copy specified files from source to repo directory."""
    for item in files_to_copy:
        source_item = source_dir / item
        destination_item = REPO_PATH / item

        try:
            destination_item.resolve().relative_to(REPO_PATH.resolve())
        except ValueError:
            print(f"{ERROR} {item} would write outside repository scope")
            continue

        if not source_item.exists():
            print(f"{WARNING} Item {item} not found in source")
            continue

        try:
            if source_item.is_file():
                destination_item.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_item, destination_item)
                print(f"{SUCCESS} Copied file {item}")
                continue

            if source_item.is_dir():
                if destination_item.exists():
                    if destination_item.is_dir():
                        shutil.rmtree(destination_item)
                    else:
                        destination_item.unlink()
                shutil.copytree(source_item, destination_item)
                print(f"{SUCCESS} Copied directory {item}")
                continue

        except OSError as e:
            print(f"{ERROR} Failed to copy {item}: {e}")


def add_jsonjsdb_config() -> None:
    """Add jsonjsdb config to index.html."""
    config_file = REPO_PATH / "data/jsonjsdb-config.html"
    index_file = REPO_PATH / "index.html"

    if not config_file.exists():
        print(f"{WARNING} jsonjsdb-config file '{config_file}' not found, no config")
        return

    if not index_file.exists():
        print(f"{WARNING} index file '{index_file}' not found, no config")
        return

    try:
        jdb_config = config_file.read_text(encoding="utf-8")
        original_index = index_file.read_text(encoding="utf-8")
        pattern = r'<div\s+id="jsonjsdb-config"[^>]*>.*?</div>'
        index_without_config = re.sub(
            pattern, "", original_index, flags=re.DOTALL | re.IGNORECASE
        )
        index_with_new_config = index_without_config + jdb_config
        index_file.write_text(index_with_new_config, encoding="utf-8")
        print(f"{SUCCESS} jsonjsdb-config added to index.html")
    except OSError as e:
        print(f"{ERROR} Error updating index.html: {e}")


def main() -> None:
    config = get_config()
    print("Start update to version:", config["targetVersion"])
    proxy_url = config.get("proxyUrl")
    asset_info = get_asset_url(config["targetVersion"], proxy_url)
    with tempfile.TemporaryDirectory(prefix="datannur_update_") as temp_dir:
        temp_path = Path(temp_dir)
        if not download_and_extract(asset_info, temp_path, proxy_url):
            print(f"{ERROR} Update failed")
            return
        copy_files(temp_path, config["include"])
        add_jsonjsdb_config()
        print(f"{SUCCESS} Update completed successfully")


if __name__ == "__main__":
    main()
