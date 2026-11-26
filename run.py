"""Serve SQLite Viewer locally using only the Python standard library."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


class ViewerHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=0, help="HTTP port (default: automatically choose an available port)")
    parser.add_argument("--no-browser", action="store_true", help="Start without opening a browser")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")

    directory = Path(__file__).resolve().parent / "web"
    if not (directory / "index.html").is_file():
        parser.exit(1, f"Viewer files are missing from {directory}\n")

    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    try:
        server = ViewerHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Could not start the viewer: {error}\n")

    with server:
        url = f"http://127.0.0.1:{server.server_port}/"
        print(f"SQLite Viewer is running at {url}", flush=True)
        print("Press Ctrl+C to stop.", flush=True)
        if not args.no_browser:
            threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nSQLite Viewer stopped.", flush=True)


if __name__ == "__main__":
    main()
