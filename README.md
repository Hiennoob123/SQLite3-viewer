# SQLite Viewer

A lightweight tool for browsing local SQLite databases. Open a file, choose a
table or view, and inspect its rows in a scrollable grid.

Database files are processed in your browser. The app uses an in-memory copy
with SQLite query-only mode enabled. All browser dependencies are bundled.

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

## Source layout

```text
web/
  index.html                 Page structure
  styles.css                 Responsive styles
  js/
    app.js                   UI and file selection
    database-client.js       Worker communication and cancellation
    database-worker.js       Database loading and paged queries
    sample-database.js       Fictional example data
  vendor/                    SQLite engine and third-party notices
run.py                       Local HTTP launcher
run.bat                      Windows launcher
```

The browser files are editable source. Changes take effect after refreshing the
page. The `web` directory can also be served by a static HTTP server. HTTP serving
is required for browser modules, workers, and WebAssembly.

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
