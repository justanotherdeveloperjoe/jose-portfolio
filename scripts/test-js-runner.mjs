// The JavaScript lab's runner: console output reads like a real console, errors are explained, and every
// starter snippet runs. (The 2-second stop for endless loops lives in the browser; check-learning-lab.cjs covers it.)
import assert from 'node:assert/strict';
import { runCode, formatValue, MAX_LINE_LENGTH } from '../src/lib/jsRunner.js';
import { jsExamples, jsExampleData } from '../src/data/jsExamples.js';

async function run(code) {
  const lines = [];
  const ok = await runCode(code, line => lines.push(line), structuredClone(jsExampleData));
  return { ok, lines, text: lines.map(line => line.text) };
}

// Values look the way a console shows them.
assert.equal(formatValue('plain text'), 'plain text');
assert.equal(formatValue(['a', 1, true, null, undefined]), "[ 'a', 1, true, null, undefined ]");
assert.equal(formatValue({ name: 'Smashouse', 'two words': 2 }), "{ name: 'Smashouse', 'two words': 2 }");
assert.equal(formatValue([]), '[]');
assert.equal(formatValue({}), '{}');
assert.equal(formatValue({ a: { b: { c: { d: 1 } } } }), '{ a: { b: { c: [Object] } } }');
const loop = { name: 'me' }; loop.self = loop;
assert.equal(formatValue(loop), "{ name: 'me', self: [Circular] }");
const shared = { x: 1 };
assert.equal(formatValue([shared, shared]), '[ { x: 1 }, { x: 1 } ]', 'The same object twice is not a loop');
assert.equal(formatValue(new Map([['live', 6]])), "Map(1) { 'live' => 6 }");
assert.equal(formatValue(new Set([1, 2])), 'Set(2) { 1, 2 }');
assert.equal(formatValue(new Date('2026-10-12T00:00:00Z')), '2026-10-12T00:00:00.000Z');
assert.equal(formatValue(function greet() {}), '[Function: greet]');
assert.equal(formatValue(class Card {}), '[class Card]');
assert.equal(formatValue(10n), '10n');
assert.equal(formatValue(-0), '-0');
assert.equal(formatValue(Symbol('id')), 'Symbol(id)');
assert.equal(formatValue(new TypeError('nope')), 'TypeError: nope');
assert.equal(formatValue(Promise.resolve(1)), 'Promise { … }');
assert.match(formatValue(Array.from({ length: 150 }, (_, i) => i)), /, 99, … 50 more \]$/);
class Point { constructor() { this.x = 1; } }
assert.equal(formatValue(new Point()), 'Point { x: 1 }');

// Running code: console lines, top-level await, a returned value, and errors that explain themselves.
let result = await run('console.log("hi", 2, [1, 2]); console.warn("careful"); console.error("oops");');
assert.deepEqual(result.lines, [{ kind: 'log', text: 'hi 2 [ 1, 2 ]' }, { kind: 'warn', text: 'careful' }, { kind: 'error', text: 'oops' }]);
result = await run('await new Promise(r => setTimeout(r, 20)); console.log("after await");');
assert.deepEqual(result.text, ['after await']);
result = await run('return [1, 2, 3].map(n => n * 2);');
assert.deepEqual(result.lines, [{ kind: 'result', text: '[ 2, 4, 6 ]' }]);
result = await run('missingThing.go();');
assert.equal(result.ok, false);
assert.deepEqual(result.lines, [{ kind: 'error', text: 'ReferenceError: missingThing is not defined' }]);
result = await run('throw "just a string";');
assert.deepEqual(result.text, ["Uncaught 'just a string'"]);
result = await run('const = 5;');
assert.equal(result.ok, false);
assert.match(result.text[0], /^SyntaxError: /);
result = await run('console.log("x".repeat(5000));');
assert.equal(result.text[0].length, MAX_LINE_LENGTH + 1, 'Very long lines are clipped');

// Every starter snippet runs and says what it should.
result = await run(jsExamples.Projects);
assert.match(result.text[0], /TK Industrial.*Smashouse.*El Sótano Cómico/);
assert.equal(result.text[1], '6 matching projects');
result = await run(jsExamples.Projects.replace('=== "live"', '=== "soon"'));
assert.deepEqual(result.text, ["[ 'Nutrióloga Allende', 'Wolf Fitness' ]", '2 matching projects']);
result = await run(jsExamples['Form check']);
assert.deepEqual(result.text, ['Ready to send — demo only.']);
result = await run(jsExamples['Form check'].replace('"Ana"', '""').replace('ana@example.com', 'invalid'));
assert.match(result.text[0], /Add your name.*Check your email/);
result = await run(jsExamples.Async);
assert.deepEqual(result.text, ['Loading projects…', '8 projects ready.']);
result = await run(jsExamples.Async.replace('shouldFail = false', 'shouldFail = true'));
assert.deepEqual(result.text, ['Loading projects…', 'Could not load projects. Try again.']);
result = await run(jsExamples.Errors);
assert.deepEqual(result.text, ['Untitled project', 'The rest of the page can still work.']);
result = await run(jsExamples.Errors.replace('{ "title": null }', '{ invalid }'));
assert.equal(result.lines[0].kind, 'warn');
assert.match(result.text[0], /SyntaxError/);
await run('data.projects.length = 0');
assert.equal((await run('console.log(data.projects.length)')).text[0], '8', 'Every execution gets a fresh project snapshot');
assert.match(jsExamples['Endless loop'], /while \(true\)/, 'The endless-loop example is there to show the sandbox stopping it');

console.log('JavaScript lab checks passed: console-style formatting, await, return values, explained errors, clipped lines, and every starter snippet.');
