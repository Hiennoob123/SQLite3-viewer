import { DatabaseClient } from './database-client.js';
import { parseStructuredJson, createJsonPreview, createJsonFields } from './json-viewer.js';

const element = (id) => document.getElementById(id);
const databaseClient = new DatabaseClient();
let currentTable = '';
let currentPage = 0;
let busy = false;
let operation = 0;

function setBusy(value, message = 'Opening database…') {
  busy = value;
  element('loading').hidden = !value;
  element('loading-text').textContent = message;
  element('open').disabled = value;
  element('sample').disabled = value;
}

function showError(error) {
  element('error').textContent = error.message;
  element('error').hidden = false;
}

function resetView() {
  currentTable = '';
  currentPage = 0;
  element('tables').replaceChildren();
  element('table-count').textContent = '0';
  element('database').textContent = 'No database open';
  element('crumb').textContent = 'Database explorer';
  element('viewer').hidden = true;
  element('welcome').hidden = false;
}

async function openDatabase(file, sample = false) {
  if (busy || (!file && !sample)) return;
  const activeOperation = ++operation;
  element('error').hidden = true;
  setBusy(true);
  try {
    let buffer;
    if (file) {
      const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (activeOperation !== operation) return;
      if (new TextDecoder().decode(header) !== 'SQLite format 3\0') {
        throw new Error(
          'This file is not a supported SQLite database. Choose a SQLite 3 database or an exported backup.',
        );
      }
      buffer = await file.arrayBuffer();
      if (activeOperation !== operation) return;
    }
    const result = await databaseClient.request('open', { buffer, sample }, buffer ? [buffer] : []);
    if (activeOperation !== operation) return;
    resetView();
    element('database').textContent = sample ? 'sample-store.sqlite' : file.name;
    element('database').title = element('database').textContent;
    element('table-count').textContent = result.tables.length;
    for (const table of result.tables) {
      const button = document.createElement('button');
      const symbol = document.createElement('span');
      symbol.className = 'table-symbol';
      symbol.textContent = table.type === 'view' ? '◫' : '▦';
      symbol.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'table-name';
      label.textContent = table.name;
      button.append(symbol, label);
      button.title = `${table.name} (${table.type})`;
      button.dataset.table = table.name;
      button.onclick = () => {
        if (!busy) loadPage(table.name, 0);
      };
      element('tables').append(button);
    }
    if (result.tables.length) await renderPage(result.tables[0].name, 0);
    else
      showError(
        new Error(
          'This database has no user tables or views. Open another database to browse its data.',
        ),
      );
  } catch (error) {
    if (activeOperation === operation && error.name !== 'AbortError') showError(error);
  } finally {
    if (activeOperation === operation) {
      setBusy(false);
      element('file').value = '';
    }
  }
}

function cellText(value) {
  if (value === null) return 'NULL';
  if (value && value.type === 'blob') return `BLOB · ${value.length} bytes`;
  if (value && value.type === 'integer') return value.value;
  return String(value);
}

async function renderPage(table, page) {
  const activeOperation = operation;
  const result = await databaseClient.request('page', { table, page });
  if (activeOperation !== operation) return;
  currentTable = table;
  const totalRows = result.total;
  const pageSize = result.pageSize;
  page = result.page;
  currentPage = page;
  element('welcome').hidden = true;
  element('viewer').hidden = false;
  element('title').textContent = table;
  element('crumb').textContent = table;
  element('row-count').textContent =
    `${totalRows.toLocaleString()} ${totalRows === 1 ? 'row' : 'rows'}`;
  element('column-count').textContent =
    `${result.columns.length} ${result.columns.length === 1 ? 'column' : 'columns'}`;
  for (const button of element('tables').children) {
    const selected = button.dataset.table === table;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
  const head = document.createElement('thead');
  const heading = document.createElement('tr');
  ['#', ...result.columns].forEach((column, i) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    th.title = column;
    if (!i) th.className = 'row-number';
    heading.append(th);
  });
  head.append(heading);
  const body = document.createElement('tbody');
  result.rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    const number = document.createElement('td');
    number.className = 'row-number';
    number.textContent = (page * pageSize + index + 1).toLocaleString();
    tr.append(number);
    row.forEach((value, column) => {
      const td = document.createElement('td');
      const json = parseStructuredJson(value);
      if (json) {
        td.className = 'json-cell';
        td.append(createJsonPreview(json));
      } else {
        td.textContent = cellText(value);
      }
      td.tabIndex = 0;
      td.title = json ? 'Review JSON fields' : 'View full value';
      if (value === null) td.className = 'null';
      if (value && value.type === 'blob') td.className = 'blob';
      const inspect = () => {
        element('cell-title').textContent = result.columns[column];
        element('json-controls').hidden = !json;
        element('json-fields').replaceChildren();
        if (json) element('json-fields').append(createJsonFields(json));
        showCellView(Boolean(json));
        element('cell-value').textContent =
          value && value.type === 'blob'
            ? `Hex (${value.length} bytes)\n\n${value.value}`
            : cellText(value);
        element('cell-dialog').showModal();
      };
      td.onclick = inspect;
      td.onkeydown = (event) => {
        if (event.key === 'Enter') inspect();
      };
      tr.append(td);
    });
    body.append(tr);
  });
  element('grid').replaceChildren(head, body);
  element('grid-wrap').scrollTop = 0;
  element('grid-wrap').scrollLeft = 0;
  element('empty').hidden = totalRows !== 0;
  element('range').textContent = totalRows
    ? `Showing ${(page * pageSize + 1).toLocaleString()}–${Math.min((page + 1) * pageSize, totalRows).toLocaleString()} of ${totalRows.toLocaleString()} rows`
    : '0 rows';
  element('page').textContent = `${page + 1} / ${Math.max(1, Math.ceil(totalRows / pageSize))}`;
  element('prev').disabled = page === 0;
  element('next').disabled = (page + 1) * pageSize >= totalRows;
}

async function loadPage(table, page) {
  if (busy) return;
  const activeOperation = ++operation;
  element('error').hidden = true;
  setBusy(true, 'Reading table…');
  try {
    await renderPage(table, page);
  } catch (error) {
    if (activeOperation === operation && error.name !== 'AbortError') showError(error);
  } finally {
    if (activeOperation === operation) setBusy(false);
  }
}

element('open').onclick = () => element('file').click();
element('file').onchange = () => openDatabase(element('file').files[0]);
element('sample').onclick = () => openDatabase(null, true);
element('dropzone').onclick = () => {
  if (!busy) element('file').click();
};
element('dropzone').onkeydown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!busy) element('file').click();
  }
};
document.addEventListener('dragover', (event) => {
  event.preventDefault();
  element('dropzone').classList.add('drag');
});
document.addEventListener('dragleave', (event) => {
  if (!event.relatedTarget) element('dropzone').classList.remove('drag');
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  element('dropzone').classList.remove('drag');
  if (event.dataTransfer.files.length) openDatabase(event.dataTransfer.files[0]);
});
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    if (!busy) element('file').click();
  }
});
element('prev').onclick = () => loadPage(currentTable, currentPage - 1);
element('next').onclick = () => loadPage(currentTable, currentPage + 1);
function showCellView(fields) {
  element('json-fields').hidden = !fields;
  element('cell-value').hidden = fields;
  element('show-fields').setAttribute('aria-pressed', String(fields));
  element('show-raw').setAttribute('aria-pressed', String(!fields));
}

element('show-fields').onclick = () => showCellView(true);
element('show-raw').onclick = () => showCellView(false);

element('close-dialog').onclick = () => element('cell-dialog').close();
element('cancel').onclick = () => {
  operation++;
  databaseClient.stop();
  resetView();
  setBusy(false);
  showError(new Error('Operation cancelled. Open a database to continue.'));
};
