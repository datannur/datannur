from __future__ import annotations

import subprocess

from apache_docker import PORT, start_container


def main() -> None:
    print(f"Apache test server: http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        start_container(detached=False)
    except subprocess.CalledProcessError as error:
        if error.returncode == 137:
            print("Apache test server stopped.")
            return
        raise


if __name__ == "__main__":
    main()
