# SQLite Viewer

A lightweight tool for browsing local SQLite databases. Open a file, choose a
table or view, and inspect its rows in a scrollable grid.

Database files are processed in your browser. The app uses an in-memory copy
with SQLite query-only mode enabled. All browser dependencies are bundled.

This tool is mainly used for inspecting logs written in sqlite3 file while developing.

## Requirements

- Python 3.10 or newer to run the local server.
- A modern browser with WebAssembly support.

## Run

On Windows, double-click `run.bat` or run it from a terminal.

On macOS or Linux, run the following from the project folder.

```sh
python3 run.py
```

The launcher chooses an available loopback port and opens your default browser.
Keep the terminal open while using the viewer. Press Ctrl+C to stop the server.
The launcher also works when called from another directory.

Optional arguments let you choose a port or start the server without opening a browser.

```sh
python3 run.py --port 8080 --no-browser
```

On Windows, use `run.bat --port 8080 --no-browser`.

## Browse a database

1. Choose **Open database**, drop a database file into the window, or try the sample.
2. Select a table or view in the sidebar.
3. Use Previous and Next to browse 100 rows per page.
4. Click a cell or focus it and press Enter to inspect its complete value.

`NULL` and binary values have distinct displays. Binary values can be inspected
as hexadecimal. SQLite integers retain their full 64-bit precision.

JSON objects and arrays show field previews directly in their cells. Open a
JSON cell to review key/value fields, expand nested objects and arrays, or switch
to **Raw JSON** to see the original text. JSON number tokens retain their original
precision. Large objects and arrays display fields in batches of 100.

## Limits

The whole database must fit in browser memory. Encrypted databases need a
compatible SQLite engine. For a database being used by another application,
open a consistent exported backup so it includes changes stored in WAL sidecars.
The viewer displays a snapshot, and paging follows SQLite's natural row order.

Local databases, virtual environments, editor settings, and generated output
are excluded by `.gitignore`.

## License

SQLite Viewer is available under the MIT license in [LICENSE](LICENSE).
Bundled dependency notices are listed in
[web/vendor/THIRD_PARTY_NOTICES.txt](web/vendor/THIRD_PARTY_NOTICES.txt).
Keep the license and author files beside the bundled engine when redistributing it.
