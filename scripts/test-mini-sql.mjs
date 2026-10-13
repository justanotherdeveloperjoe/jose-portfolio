// The SQL lab's engine: real answers about the real projects, and friendly errors instead of crashes.
import assert from 'node:assert/strict';
import { runQuery, SqlError } from '../src/lib/miniSql.js';
import { labTables } from '../src/data/labTables.js';

const run = sql => runQuery(sql, labTables);
const names = sql => run(sql).rows.map(row => row[0]);
const fails = (sql, pattern) => assert.throws(() => run(sql), error => error instanceof SqlError && pattern.test(error.message), `Expected a friendly error for: ${sql}`);

// The table really is the Workbench data: 8 projects, 6 live, 2 coming soon.
assert.equal(run('SELECT * FROM projects').rows.length, 8);
assert.deepEqual(run('SELECT * FROM projects LIMIT 2').columns, ['id', 'name', 'category', 'status']);

// The three starter queries in the lab.
assert.deepEqual(names("SELECT name, category FROM projects WHERE status = 'live' ORDER BY name;"),
  ['AFH Logistics', 'El Sótano Cómico', 'Ikinuki Trip Agency', 'Propiedades Allende', 'Smashouse', 'TK Industrial']);
assert.deepEqual(run('SELECT status, COUNT(*) AS projects FROM projects GROUP BY status ORDER BY projects DESC;').rows, [['live', 6], ['soon', 2]]);
assert.deepEqual(run('SELECT status, COUNT(*) AS projects FROM projects GROUP BY status;').columns, ['status', 'projects']);
// Without ORDER BY, groups come out sorted by the grouped value, as in SQLite ('live' before 'soon').
assert.deepEqual(run('SELECT status, COUNT(*) FROM projects GROUP BY status').rows, [['live', 6], ['soon', 2]]);
assert.deepEqual(run('SELECT status, COUNT(*) AS n FROM projects GROUP BY status ORDER BY n').rows, [['soon', 2], ['live', 6]]);
assert.deepEqual(names("SELECT name FROM projects WHERE category LIKE '%fit%' OR name LIKE '%allende%' ORDER BY id;"),
  ['Nutrióloga Allende', 'Wolf Fitness', 'Propiedades Allende']);

// Filters, logic and ordering.
assert.deepEqual(names('SELECT name FROM projects WHERE id IN (1, 3)'), ['Nutrióloga Allende', 'Wolf Fitness']);
assert.deepEqual(names("SELECT name FROM projects WHERE id NOT IN (1, 2, 3, 4, 5, 6, 7)"), ['Ikinuki Trip Agency']);
assert.equal(names("SELECT name FROM projects WHERE NOT status = 'live'").length, 2);
assert.deepEqual(names("SELECT name FROM projects WHERE status <> 'live' AND id > 2"), ['Wolf Fitness']);
assert.deepEqual(names("SELECT name FROM projects WHERE (status = 'soon' OR id = 8) AND id >= 3 ORDER BY id DESC"), ['Ikinuki Trip Agency', 'Wolf Fitness']);
assert.deepEqual(names('SELECT id FROM projects ORDER BY id DESC LIMIT 3'), [8, 7, 6]);
assert.deepEqual(run('SELECT DISTINCT status FROM projects ORDER BY status').rows, [['live'], ['soon']]);
assert.deepEqual(run('SELECT COUNT(*) FROM projects').rows, [[8]]);
assert.deepEqual(run('SELECT COUNT(*) FROM projects').columns, ['COUNT(*)']);
assert.deepEqual(run("SELECT COUNT(*) AS n FROM projects WHERE status = 'gone'").rows, [[0]]);
assert.deepEqual(names("SELECT name FROM projects WHERE name LIKE '_mashouse'"), ['Smashouse']);

// SQLite's rules: = is case-sensitive, LIKE isn't; NULL never matches; keywords and names ignore case.
assert.equal(run("SELECT * FROM projects WHERE status = 'LIVE'").rows.length, 0);
assert.equal(run("SELECT * FROM projects WHERE status LIKE 'LIVE'").rows.length, 6);
assert.equal(run('SELECT * FROM projects WHERE category IS NULL').rows.length, 0);
assert.equal(run('SELECT * FROM projects WHERE category IS NOT NULL').rows.length, 8);
assert.equal(run('SELECT * FROM projects WHERE category = NULL').rows.length, 0);
assert.equal(run("select NAME from PROJECTS where Status = 'live'").rows.length, 6);
assert.equal(run("-- my live sites\nSELECT name FROM projects WHERE status = 'live'").rows.length, 6);
assert.equal(run("SELECT name FROM projects WHERE name = 'It''s'").rows.length, 0);
assert.deepEqual(run('SELECT name AS project FROM projects LIMIT 1').columns, ['project']);
assert.deepEqual(run("SELECT name FROM skills WHERE status = 'Going deeper'").rows, [['JavaScript'], ['React']]);

// Friendly errors, never a crash.
fails('DELETE FROM projects', /read-only/);
fails('DROP TABLE projects', /read-only/);
fails('SELECT nme FROM projects', /no column called "nme".*id, name, category, status/);
fails('SELECT * FROM project', /no table called "project"/);
fails("SELECT name FROM projects WHERE status = 'live", /missing its closing quote/);
fails('SELECT name projects', /Expected FROM/);
fails('SELECT name, COUNT(*) FROM projects GROUP BY status', /"name" needs to be in GROUP BY/);
fails('SELECT name FROM projects WHERE COUNT(*) > 1', /belongs in SELECT/);
fails('', /Type a query first/);
fails('   ', /Type a query first/);
fails('SELECT name FROM projects LIMIT two', /whole number/);
fails('SELECT *, COUNT(*) FROM projects', /can't be combined/);
fails('SELECT name FROM projects WHERE', /query ended there/);
fails('SELECT name FROM projects WHERE status = ', /query ended there/);
fails('SELECT name FROM projects ORDER name', /Expected BY/);
fails('SELECT name FROM projects WHERE id ~ 2', /don't understand "~"/);
fails('SELECT name FROM projects WHERE nme = 1', /no column called "nme"/);

// Throw anything at it: every input either answers or explains itself — nothing else ever escapes.
const vocabulary = ['SELECT', 'FROM', 'projects', 'skills', 'WHERE', 'name', 'id', 'status', '*', ',', '(', ')', '=', '<', 'AND', 'OR', 'NOT', 'IN', 'LIKE', "'live'", "'%a%'", '1', '2', 'GROUP', 'ORDER', 'BY', 'COUNT', 'DESC', 'LIMIT', 'IS', 'NULL', 'AS', 'DISTINCT', ';', "'", '"', '~'];
let answered = 0;
for (let trial = 0; trial < 5000; trial++) {
  const length = 1 + Math.floor(Math.random() * 14);
  const sql = Array.from({ length }, () => vocabulary[Math.floor(Math.random() * vocabulary.length)]).join(' ');
  try { run(sql); answered++; } catch (error) { assert.ok(error instanceof SqlError, `Unfriendly crash for: ${sql}\n${error.stack}`); }
}

// And mostly-valid queries built from the grammar, so the part that computes answers gets hammered too.
const pick = items => items[Math.floor(Math.random() * items.length)];
const value = () => pick(['id', 'name', 'status', 'category', "'live'", "'soon'", "'%o%'", '1', '3', '8', 'NULL', 'TRUE']);
function condition(depth = 0) {
  if (depth > 2 || Math.random() < 0.4) return pick([
    () => `${value()} ${pick(['=', '!=', '<>', '<', '>', '<=', '>='])} ${value()}`,
    () => `${value()} ${pick(['LIKE', 'NOT LIKE'])} ${pick(["'%a%'", "'_mashouse'", "'live'", 'name'])}`,
    () => `${value()} ${pick(['IN', 'NOT IN'])} (${value()}, ${value()})`,
    () => `${value()} IS ${pick(['', 'NOT '])}NULL`,
  ])();
  return pick([() => `(${condition(depth + 1)}) ${pick(['AND', 'OR'])} ${condition(depth + 1)}`, () => `NOT ${condition(depth + 1)}`])();
}
let computed = 0;
for (let trial = 0; trial < 3000; trial++) {
  const grouped = Math.random() < 0.3;
  const select = grouped ? 'status, COUNT(*) AS n' : pick(['*', 'name', 'id, name', 'DISTINCT status', 'name AS project, category']);
  let sql = `SELECT ${select} FROM ${pick(['projects', 'projects', 'skills'])}`;
  if (Math.random() < 0.8) sql += ` WHERE ${condition()}`;
  if (grouped) sql += ' GROUP BY status';
  if (Math.random() < 0.5) sql += ` ORDER BY ${grouped ? pick(['n', 'status']) : pick(['id', 'name', 'status'])}${pick(['', ' DESC', ' ASC'])}`;
  if (Math.random() < 0.3) sql += ` LIMIT ${Math.floor(Math.random() * 5)}`;
  try {
    const result = run(sql);
    assert.ok(result.rows.every(row => row.length === result.columns.length), `Ragged rows for: ${sql}`);
    assert.ok(result.rows.length <= 8, `Too many rows for: ${sql}`);
    computed++;
  } catch (error) { assert.ok(error instanceof SqlError, `Unfriendly crash for: ${sql}\n${error.stack}`); }
}
assert.ok(computed > 1500, `Only ${computed} of the generated queries ran — the generator isn't exercising the evaluator`);

console.log(`SQL lab checks passed: real answers about the 8 projects, SQLite-style rules, friendly errors, 5,000 random token soups (all explained, ${answered} answered) and 3,000 generated queries (${computed} computed) with no crashes.`);
