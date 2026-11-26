function createSampleDatabase(SQL) {
  const db = new SQL.Database();
  db.run(
    'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, in_stock INTEGER, description TEXT)',
  );
  db.run(
    'CREATE TABLE orders (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER, ordered_at TEXT)',
  );
  db.run('CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
  const products = [
    ['Studio headphones', 'Audio', 149, 24, 'Over-ear headphones with a balanced, detailed sound.'],
    ['Mechanical keyboard', 'Accessories', 89, 42, 'Compact layout · tactile switches'],
    ['Desk lamp', 'Workspace', 54.5, 18, 'Warm light, adjustable arm'],
    ['Portable speaker', 'Audio', 69, 31, null],
    ['Canvas tote', 'Everyday', 18, 85, 'Natural cotton canvas'],
    ['Monitor stand', 'Workspace', 45, 12, 'Solid oak'],
    ['Wireless mouse', 'Accessories', 39.99, 56, 'Quiet clicks, comfortable shape'],
    ['Ceramic mug', 'Everyday', 24, 38, 'Hand-glazed · 350 ml'],
    ['USB-C hub', 'Accessories', 59, 0, 'Six ports in one compact hub'],
    ['Notebook set', 'Everyday', 16.5, 72, 'Three notebooks, dotted pages'],
    ['Laptop sleeve', 'Accessories', 32, 27, 'Fits 14-inch laptops'],
    ['Desk mat', 'Workspace', 29, 44, 'A softer surface for your workspace'],
  ];
  products.forEach((product, index) =>
    db.run('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)', [index + 1, ...product]),
  );
  db.run(
    "INSERT INTO customers VALUES (1, 'Example Customer 1', 'customer1@example.com'), (2, 'Example Customer 2', 'customer2@example.com')",
  );
  db.run("INSERT INTO orders VALUES (1, 3, 1, '2024-01-01'), (2, 8, 2, '2024-01-02')");
  return db;
}
