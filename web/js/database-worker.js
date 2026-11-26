/* The worker exposes database inspection through fixed SELECT queries. */
importScripts('../vendor/sql-wasm.js', 'sample-database.js');

const engine = initSqlJs({ locateFile: (name) => `../vendor/${name}` });
const PAGE_SIZE = 100;
let database;
let tables = [];

function quoteIdentifier(name) {
  return '"' + name.replaceAll('"', '""') + '"';
}

function serializeValue(value) {
  if (typeof value === 'bigint') {
    return { type: 'integer', value: value.toString() };
  }
  if (value instanceof Uint8Array) {
    return {
      type: 'blob',
      value: Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join(''),
      length: value.length,
    };
  }
  return value;
}

function openDatabase(SQL, { sample, buffer }) {
  let candidate;
  try {
    candidate = sample ? createSampleDatabase(SQL) : new SQL.Database(new Uint8Array(buffer));
    candidate.run('PRAGMA query_only = ON');
    const result = candidate.exec(`
      SELECT name, type FROM sqlite_schema
      WHERE type IN ('table', 'view') AND substr(name, 1, 7) != 'sqlite_'
      ORDER BY name
    `);
    const nextTables = result.length
      ? result[0].values.map(([name, type]) => ({ name, type }))
      : [];

    if (database) database.close();
    database = candidate;
    tables = nextTables;
    return { tables };
  } catch (error) {
    if (candidate && candidate !== database) candidate.close();
    throw error;
  }
}

function readPage({ table, page }) {
  if (!database || !tables.some((entry) => entry.name === table)) {
    throw new Error('Choose a table from the sidebar.');
  }
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error('The page number must be a non-negative integer.');
  }

  const name = quoteIdentifier(table);
  const total = database.exec(`SELECT COUNT(*) FROM ${name}`)[0].values[0][0];
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const statement = database.prepare(`SELECT * FROM ${name} LIMIT ? OFFSET ?`);
  try {
    statement.bind([PAGE_SIZE, currentPage * PAGE_SIZE]);
    const columns = statement.getColumnNames();
    const rows = [];
    while (statement.step()) {
      rows.push(statement.get(null, { useBigInt: true }).map(serializeValue));
    }
    return { total, columns, rows, page: currentPage, pageSize: PAGE_SIZE };
  } finally {
    statement.free();
  }
}

self.onmessage = async ({ data }) => {
  try {
    const SQL = await engine;
    let result;
    switch (data.action) {
      case 'open':
        result = openDatabase(SQL, data);
        break;
      case 'page':
        result = readPage(data);
        break;
      default:
        throw new Error('Unsupported database operation.');
    }
    self.postMessage({ id: data.id, ...result });
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message || String(error) });
  }
};
