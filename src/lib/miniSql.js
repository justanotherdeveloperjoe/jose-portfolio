// A tiny, read-only SQL engine for the Learning section: real SELECT queries over small in-memory tables.
//
//   SELECT [DISTINCT] * | expr [AS name], … | COUNT(*) FROM table
//     [WHERE …] [GROUP BY …] [ORDER BY … [ASC|DESC], …] [LIMIT n]
//
// WHERE understands = != <> < > <= >=, LIKE (% and _), IN (…), IS [NOT] NULL, AND / OR / NOT and parentheses.
// It follows SQLite's rules where they matter: = is case-sensitive, LIKE is not, and NULL never equals anything.

export class SqlError extends Error {}

const KEYWORDS = new Set(['SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'LIKE', 'IN', 'IS', 'NULL', 'GROUP', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'AS', 'COUNT', 'TRUE', 'FALSE']);
const WRITES = /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE|TRUNCATE|MERGE|UPSERT)$/i;

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  while (i < sql.length) {
    const rest = sql.slice(i);
    if (/^\s/.test(rest)) { i++; continue; }
    if (rest.startsWith('--')) { const end = sql.indexOf('\n', i); i = end < 0 ? sql.length : end; continue; }
    if (rest[0] === "'") {
      let j = i + 1, text = '';
      for (;;) {
        if (j >= sql.length) throw new SqlError("A text value is missing its closing quote (').");
        if (sql[j] === "'") { if (sql[j + 1] === "'") { text += "'"; j += 2; continue; } break; }
        text += sql[j++];
      }
      tokens.push({ type: 'string', value: text, text: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (rest[0] === '"') {
      const end = sql.indexOf('"', i + 1);
      if (end < 0) throw new SqlError('A quoted name is missing its closing quote (").');
      tokens.push({ type: 'ident', value: sql.slice(i + 1, end), text: sql.slice(i, end + 1) });
      i = end + 1;
      continue;
    }
    const number = /^\d+(\.\d+)?/.exec(rest);
    if (number) { tokens.push({ type: 'number', value: Number(number[0]), text: number[0] }); i += number[0].length; continue; }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (word) {
      const upper = word[0].toUpperCase();
      tokens.push(KEYWORDS.has(upper) ? { type: 'keyword', value: upper, text: word[0] } : { type: 'ident', value: word[0], text: word[0] });
      i += word[0].length;
      continue;
    }
    const op = /^(<>|!=|<=|>=|=|<|>|\(|\)|,|\*|;)/.exec(rest);
    if (op) { tokens.push({ type: 'op', value: op[0], text: op[0] }); i += op[0].length; continue; }
    throw new SqlError(`I don't understand "${rest[0]}" here.`);
  }
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const isKeyword = value => peek()?.type === 'keyword' && peek().value === value;
  const isOp = value => peek()?.type === 'op' && peek().value === value;
  const next = () => tokens[pos++];
  const fail = message => { throw new SqlError(peek() ? `${message} near "${peek().text}".` : `${message}, but the query ended there.`); };
  const expectKeyword = value => (isKeyword(value) ? next() : fail(`Expected ${value}`));
  const expectOp = value => (isOp(value) ? next() : fail(`Expected "${value}"`));
  const list = item => { const items = [item()]; while (isOp(',')) { next(); items.push(item()); } return items; };

  function primary() {
    const token = peek();
    if (!token) fail('Expected a value');
    if (token.type === 'number' || token.type === 'string') { next(); return { literal: token.value }; }
    if (isKeyword('NULL')) { next(); return { literal: null }; }
    if (isKeyword('TRUE') || isKeyword('FALSE')) { next(); return { literal: token.value === 'TRUE' }; }
    if (isKeyword('COUNT')) {
      next(); expectOp('(');
      const arg = isOp('*') ? (next(), null) : expression();
      expectOp(')');
      return { count: true, arg };
    }
    if (token.type === 'ident') { next(); return { column: token.value }; }
    if (isOp('(')) { next(); const inner = expression(); expectOp(')'); return inner; }
    return fail('Expected a value');
  }
  function comparison() {
    const left = primary();
    if (peek()?.type === 'op' && ['=', '!=', '<>', '<', '>', '<=', '>='].includes(peek().value)) {
      const op = next().value;
      return { op: op === '<>' ? '!=' : op, left, right: primary() };
    }
    let negate = false;
    if (isKeyword('NOT')) { next(); negate = true; if (!isKeyword('LIKE') && !isKeyword('IN')) fail('Expected LIKE or IN after NOT'); }
    let node = null;
    if (isKeyword('LIKE')) { next(); node = { op: 'LIKE', left, right: primary() }; }
    else if (isKeyword('IN')) { next(); expectOp('('); node = { op: 'IN', left, values: list(primary) }; expectOp(')'); }
    else if (isKeyword('IS')) { next(); const not = isKeyword('NOT') ? (next(), true) : false; expectKeyword('NULL'); return { op: not ? 'IS NOT NULL' : 'IS NULL', value: left }; }
    if (!node) return left;
    return negate ? { op: 'NOT', value: node } : node;
  }
  function not() { if (isKeyword('NOT')) { next(); return { op: 'NOT', value: not() }; } return comparison(); }
  function and() { let left = not(); while (isKeyword('AND')) { next(); left = { op: 'AND', left, right: not() }; } return left; }
  function expression() { let left = and(); while (isKeyword('OR')) { next(); left = { op: 'OR', left, right: and() }; } return left; }

  const first = peek();
  if (!first) throw new SqlError('Type a query first — try SELECT * FROM projects;');
  if (WRITES.test(first.text)) throw new SqlError('This table is read-only — only SELECT queries run here.');
  if (!isKeyword('SELECT')) fail('Queries start with SELECT');
  next();
  const distinct = isKeyword('DISTINCT') ? (next(), true) : false;
  const columns = list(() => {
    if (isOp('*')) { next(); return { star: true }; }
    const expr = expression();
    let alias = null;
    if (isKeyword('AS')) { next(); const name = next(); if (!name || (name.type !== 'ident' && name.type !== 'string')) fail('Expected a name after AS'); alias = name.value; }
    else if (peek()?.type === 'ident') alias = next().value;
    return { expr, alias };
  });
  expectKeyword('FROM');
  const table = next();
  if (!table || table.type !== 'ident') { pos--; fail('Expected a table name after FROM'); }
  const query = { distinct, columns, table: table.value, where: null, groupBy: [], orderBy: [], limit: null };
  if (isKeyword('WHERE')) { next(); query.where = expression(); }
  if (isKeyword('GROUP')) { next(); expectKeyword('BY'); query.groupBy = list(expression); }
  if (isKeyword('ORDER')) {
    next(); expectKeyword('BY');
    query.orderBy = list(() => { const expr = expression(); if (isKeyword('DESC')) { next(); return { expr, desc: true }; } if (isKeyword('ASC')) next(); return { expr, desc: false }; });
  }
  if (isKeyword('LIMIT')) { next(); const n = next(); if (!n || n.type !== 'number' || !Number.isInteger(n.value)) { pos--; fail('LIMIT needs a whole number'); } query.limit = n.value; }
  if (isOp(';')) next();
  if (pos < tokens.length) fail('Something extra is left over');
  return query;
}

// SQL's three-valued logic: comparisons with NULL are unknown (null), and only true rows survive WHERE.
const and3 = (a, b) => (a === false || b === false ? false : a === null || b === null ? null : true);
const or3 = (a, b) => (a === true || b === true ? true : a === null || b === null ? null : false);
const truthy = value => value === true || (typeof value === 'number' && value !== 0);
const toBool = value => (value === null ? null : truthy(value));
function compare(a, b) {
  if (a === null || b === null) return null;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'number') return -1; // SQLite orders numbers before text
  if (typeof b === 'number') return 1;
  const left = String(a), right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}
function likeToRegExp(pattern) {
  const source = [...String(pattern)].map(ch => (ch === '%' ? '.*' : ch === '_' ? '.' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('');
  return new RegExp(`^${source}$`, 'is');
}
const hasCount = node => Boolean(node) && (node.count || ['left', 'right', 'value', 'arg'].some(key => hasCount(node[key])) || (node.values || []).some(hasCount));
const labelOf = node => (node.column ?? (node.count ? `COUNT(${node.arg?.column ?? '*'})` : node.literal !== undefined ? String(node.literal) : 'value'));

export function runQuery(sql, tables) {
  const started = globalThis.performance?.now() ?? Date.now();
  const query = parse(tokenize(sql));
  const table = tables[query.table.toLowerCase()];
  if (!table) throw new SqlError(`There's no table called "${query.table}". Try ${Object.keys(tables).join(' or ')}.`);

  const columnName = name => {
    const found = table.columns.find(column => column.toLowerCase() === name.toLowerCase());
    if (!found) throw new SqlError(`There's no column called "${name}". The ${query.table.toLowerCase()} table has: ${table.columns.join(', ')}.`);
    return found;
  };
  const evaluate = (node, row, group) => {
    if ('literal' in node) return node.literal;
    if (node.column) return row ? row[columnName(node.column)] ?? null : null;
    if (node.count) {
      if (!group) throw new SqlError('COUNT() counts groups of rows, so it belongs in SELECT (with GROUP BY), not in WHERE.');
      return node.arg ? group.filter(r => evaluate(node.arg, r) !== null).length : group.length;
    }
    switch (node.op) {
      case 'AND': return and3(toBool(evaluate(node.left, row, group)), toBool(evaluate(node.right, row, group)));
      case 'OR': return or3(toBool(evaluate(node.left, row, group)), toBool(evaluate(node.right, row, group)));
      case 'NOT': { const value = toBool(evaluate(node.value, row, group)); return value === null ? null : !value; }
      case 'IS NULL': return evaluate(node.value, row, group) === null;
      case 'IS NOT NULL': return evaluate(node.value, row, group) !== null;
      case 'LIKE': {
        const value = evaluate(node.left, row, group), pattern = evaluate(node.right, row, group);
        return value === null || pattern === null ? null : likeToRegExp(pattern).test(String(value));
      }
      case 'IN': {
        const value = evaluate(node.left, row, group);
        if (value === null) return null;
        const options = node.values.map(option => evaluate(option, row, group));
        return options.some(option => option !== null && compare(value, option) === 0) ? true : options.includes(null) ? null : false;
      }
      default: {
        const order = compare(evaluate(node.left, row, group), evaluate(node.right, row, group));
        if (order === null) return null;
        return { '=': order === 0, '!=': order !== 0, '<': order < 0, '>': order > 0, '<=': order <= 0, '>=': order >= 0 }[node.op];
      }
    }
  };

  // Check every column name up front, so a typo is reported even when no rows would reach it.
  // ORDER BY may also use a name given in SELECT (… AS projects … ORDER BY projects), so those are allowed there.
  const visit = node => { if (!node || typeof node !== 'object') return; if (node.column) columnName(node.column); Object.values(node).forEach(child => (Array.isArray(child) ? child.forEach(visit) : visit(child))); };
  const aliases = new Set(query.columns.filter(c => c.alias).map(c => c.alias.toLowerCase()));
  query.columns.forEach(c => visit(c.expr));
  visit(query.where);
  query.groupBy.forEach(visit);
  query.orderBy.forEach(({ expr }) => { if (!(expr.column && aliases.has(expr.column.toLowerCase()))) visit(expr); });
  if (query.where && hasCount(query.where)) throw new SqlError('COUNT() counts groups of rows, so it belongs in SELECT (with GROUP BY), not in WHERE.');

  const filtered = query.where ? table.rows.filter(row => truthy(evaluate(query.where, row))) : table.rows;
  const grouped = query.groupBy.length > 0 || query.columns.some(c => !c.star && hasCount(c.expr));
  const headers = query.columns.flatMap(c => (c.star ? table.columns : [c.alias ?? labelOf(c.expr)]));
  let records;
  if (grouped) {
    if (query.columns.some(c => c.star)) throw new SqlError('SELECT * can\'t be combined with COUNT() or GROUP BY — name the columns instead.');
    const keyOf = row => JSON.stringify(query.groupBy.map(expr => evaluate(expr, row)));
    const groups = new Map();
    for (const row of filtered) { const key = keyOf(row); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
    if (!query.groupBy.length && !groups.size) groups.set('[]', []);
    const grouping = new Set(query.groupBy.filter(expr => expr.column).map(expr => columnName(expr.column)));
    const checkGrouped = node => {
      if (!node || typeof node !== 'object' || node.count) return;
      if (node.column && !grouping.has(columnName(node.column))) throw new SqlError(`"${node.column}" needs to be in GROUP BY, or counted with COUNT().`);
      Object.values(node).forEach(child => (Array.isArray(child) ? child.forEach(checkGrouped) : checkGrouped(child)));
    };
    query.columns.forEach(c => checkGrouped(c.expr));
    records = [...groups.values()].map(group => ({ source: group[0] ?? null, group, values: query.columns.map(c => evaluate(c.expr, group[0] ?? null, group)) }));
    // Like SQLite, groups come out sorted by what they're grouped on (ORDER BY, if given, still decides).
    const groupKey = record => query.groupBy.map(expr => evaluate(expr, record.source));
    records.sort((a, b) => { const x = groupKey(a), y = groupKey(b); for (let i = 0; i < x.length; i++) { const order = x[i] === null && y[i] === null ? 0 : x[i] === null ? -1 : y[i] === null ? 1 : compare(x[i], y[i]); if (order) return order; } return 0; });
  } else {
    records = filtered.map(row => ({ source: row, group: null, values: query.columns.flatMap(c => (c.star ? table.columns.map(name => row[name]) : [evaluate(c.expr, row, null)])) }));
  }

  if (query.distinct) {
    const seen = new Set();
    records = records.filter(record => { const key = JSON.stringify(record.values); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  if (query.orderBy.length) {
    // ORDER BY can name an output column (or its alias) or any column of the table.
    const sortValue = (expr, record) => {
      if (expr.column) { const index = headers.findIndex(h => h.toLowerCase() === expr.column.toLowerCase()); if (index >= 0) return record.values[index]; }
      return evaluate(expr, record.source, record.group);
    };
    records = [...records].sort((a, b) => {
      for (const { expr, desc } of query.orderBy) {
        const x = sortValue(expr, a), y = sortValue(expr, b);
        const order = x === null && y === null ? 0 : x === null ? -1 : y === null ? 1 : compare(x, y);
        if (order) return desc ? -order : order;
      }
      return 0;
    });
  }
  if (query.limit !== null) records = records.slice(0, query.limit);
  const ms = (globalThis.performance?.now() ?? Date.now()) - started;
  return { columns: headers, rows: records.map(record => record.values), ms };
}
