// The heart of the JavaScript lab: runs a visitor's code and turns console output into readable lines,
// the way a browser console would show them. It always runs inside a Web Worker (see jsRunner.worker.js),
// away from the page, and the page stops the worker after 2 seconds — so nothing typed here can touch the
// site or freeze it. It's shared with the tests, which run it directly.

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
export const MAX_LINE_LENGTH = 2000;

const key = name => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`);

// Shows a value the way the console does: strings plain at the top level and quoted inside objects,
// nested objects to three levels, long lists trimmed, and a loop back to itself shown as [Circular].
export function formatValue(value, depth = 0, seen = new WeakSet(), top = true) {
  if (typeof value === 'string') return top ? value : `'${value}'`;
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'symbol') return value.toString();
  if (value === null || value === undefined || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return /^class\b/.test(Function.prototype.toString.call(value)) ? `[class ${value.name || '(anonymous)'}]` : `[Function: ${value.name || '(anonymous)'}]`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (typeof value.then === 'function') return 'Promise { … }';
  if (seen.has(value)) return '[Circular]';
  if (depth >= 3) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  try {
    const inner = item => formatValue(item, depth + 1, seen, false);
    const trimmed = (items, total, limit) => (total > limit ? [...items, `… ${total - limit} more`] : items);
    if (Array.isArray(value)) return value.length ? `[ ${trimmed(value.slice(0, 100).map(inner), value.length, 100).join(', ')} ]` : '[]';
    if (value instanceof Map) return `Map(${value.size}) {${value.size ? ` ${trimmed([...value].slice(0, 50).map(([k, v]) => `${inner(k)} => ${inner(v)}`), value.size, 50).join(', ')} ` : ''}}`;
    if (value instanceof Set) return `Set(${value.size}) {${value.size ? ` ${trimmed([...value].slice(0, 50).map(inner), value.size, 50).join(', ')} ` : ''}}`;
    const entries = Object.entries(value);
    const name = value.constructor && value.constructor !== Object && value.constructor.name ? `${value.constructor.name} ` : '';
    return entries.length ? `${name}{ ${trimmed(entries.slice(0, 50).map(([k, v]) => `${key(k)}: ${inner(v)}`), entries.length, 50).join(', ')} }` : `${name}{}`;
  } finally {
    seen.delete(value);
  }
}

const clip = text => (text.length > MAX_LINE_LENGTH ? `${text.slice(0, MAX_LINE_LENGTH)}…` : text);
export const describeError = error => clip(error instanceof Error ? `${error.name}: ${error.message}` : `Uncaught ${formatValue(error, 0, new WeakSet(), false)}`);

// Runs code as the body of an async function, so `await` works at the top level and `return x` shows x.
// emit({ kind, text }) is called for every console line, as it happens.
export async function runCode(code, emit, data = {}) {
  const line = kind => (...args) => emit({ kind, text: clip(args.map(arg => formatValue(arg)).join(' ')) });
  const sandboxConsole = { log: line('log'), info: line('log'), debug: line('log'), table: line('log'), dir: line('log'), warn: line('warn'), error: line('error') };
  let run;
  try {
    run = new AsyncFunction('console', 'data', code);
  } catch (error) {
    emit({ kind: 'error', text: describeError(error) });
    return false;
  }
  try {
    const result = await run(sandboxConsole, data);
    if (result !== undefined) emit({ kind: 'result', text: clip(formatValue(result)) });
    return true;
  } catch (error) {
    emit({ kind: 'error', text: describeError(error) });
    return false;
  }
}
