// Keep numeric tokens as text so JSON integers retain their original precision.
export function parseStructuredJson(value) {
  if (typeof value !== 'string' || !/^\s*[\[{]/.test(value)) return null;
  try {
    JSON.parse(value);
  } catch {
    return null;
  }

  const tokens = value.match(/"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g);
  const stack = [];
  let root;

  function append(node) {
    const parent = stack.at(-1);
    if (!parent) {
      root = node;
      return;
    }
    const key = parent.type === 'array' ? String(parent.entries.length) : parent.pendingKey;
    parent.entries.push({ key, node });
    delete parent.pendingKey;
  }

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === '{' || token === '[') {
      const node = { type: token === '{' ? 'object' : 'array', entries: [] };
      append(node);
      stack.push(node);
    } else if (token === '}' || token === ']') {
      stack.pop();
    } else if (token === ':' || token === ',') {
      continue;
    } else if (tokens[index + 1] === ':') {
      stack.at(-1).pendingKey = JSON.parse(token);
    } else {
      let type = 'number';
      if (token.startsWith('"')) type = 'string';
      else if (token === 'null') type = 'null';
      else if (token === 'true' || token === 'false') type = 'boolean';
      append({ type, text: token });
    }
  }
  return root;
}

function describe(node) {
  if (!node.entries) return node.text;
  const count = node.entries.length;
  const unit = node.type === 'array' ? 'item' : 'field';
  return `${node.type === 'array' ? 'Array' : 'Object'} · ${count} ${unit}${count === 1 ? '' : 's'}`;
}

function createKey(key, array) {
  const label = document.createElement('span');
  label.className = 'json-key';
  label.textContent = array ? `[${key}]` : JSON.stringify(key).slice(1, -1);
  return label;
}

function createValue(node) {
  const value = document.createElement('span');
  value.className = `json-value json-${node.type}`;
  value.textContent = describe(node);
  return value;
}

export function createJsonPreview(node) {
  const preview = document.createElement('div');
  preview.className = 'json-preview';
  const heading = document.createElement('span');
  heading.className = 'json-summary';
  heading.textContent = `JSON ${describe(node)}`;
  preview.append(heading);

  for (const { key, node: child } of node.entries.slice(0, 3)) {
    const row = document.createElement('div');
    row.className = 'json-preview-field';
    row.append(createKey(key, node.type === 'array'), createValue(child));
    preview.append(row);
  }
  if (node.entries.length > 3) {
    const remaining = document.createElement('span');
    remaining.className = 'json-more';
    remaining.textContent = `+${node.entries.length - 3} more`;
    preview.append(remaining);
  }
  return preview;
}

export function createJsonFields(node) {
  const fields = document.createElement('div');
  fields.className = 'json-fields';
  if (!node.entries.length) {
    const empty = document.createElement('p');
    empty.className = 'json-empty';
    empty.textContent = node.type === 'array' ? 'Empty array' : 'Empty object';
    fields.append(empty);
    return fields;
  }

  let rendered = 0;
  const more = document.createElement('button');
  more.className = 'json-load-more';
  more.type = 'button';

  function appendBatch() {
    more.remove();
    const batch = node.entries.slice(rendered, rendered + 100);
    for (const { key, node: child } of batch) {
      const label = createKey(key, node.type === 'array');
      if (child.entries) {
        const group = document.createElement('details');
        group.className = 'json-group';
        const summary = document.createElement('summary');
        summary.append(label, createValue(child));
        group.append(summary);
        group.addEventListener('toggle', () => {
          if (group.open && group.children.length === 1) {
            group.append(createJsonFields(child));
          }
        });
        fields.append(group);
      } else {
        const row = document.createElement('div');
        row.className = 'json-field';
        row.append(label, createValue(child));
        fields.append(row);
      }
    }
    rendered += batch.length;
    if (rendered < node.entries.length) {
      more.textContent = `Show next ${Math.min(100, node.entries.length - rendered)} (${node.entries.length - rendered} remaining)`;
      fields.append(more);
    }
  }

  more.addEventListener('click', appendBatch);
  appendBatch();
  return fields;
}
