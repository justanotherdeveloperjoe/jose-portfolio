// Runs one visitor snippet, off the page. A fresh worker is made for every run and thrown away after,
// so nothing carries over between runs, and the page can stop it at any moment (see runJs.js).
import { runCode, describeError } from './jsRunner.js';

const send = message => self.postMessage(message);
const emit = line => send({ type: 'line', line });

// Count pending timers, so the run is "done" only once the code AND any setTimeout it started have finished.
const pending = new Set();
let settled = false;
const finishIfIdle = () => { if (settled && pending.size === 0) send({ type: 'done' }); };
const native = { setTimeout: self.setTimeout.bind(self), clearTimeout: self.clearTimeout.bind(self), setInterval: self.setInterval.bind(self), clearInterval: self.clearInterval.bind(self) };
const guarded = callback => (...args) => { try { if (typeof callback === 'function') callback(...args); } catch (error) { emit({ kind: 'error', text: describeError(error) }); } };

self.setTimeout = (callback, ms, ...args) => {
  const id = native.setTimeout(() => { pending.delete(id); guarded(callback)(...args); finishIfIdle(); }, ms);
  pending.add(id);
  return id;
};
self.clearTimeout = id => { pending.delete(id); native.clearTimeout(id); finishIfIdle(); };
self.setInterval = (callback, ms, ...args) => { const id = native.setInterval(guarded(callback), ms, ...args); pending.add(id); return id; };
self.clearInterval = id => { pending.delete(id); native.clearInterval(id); finishIfIdle(); };
self.addEventListener('unhandledrejection', event => { event.preventDefault(); emit({ kind: 'error', text: describeError(event.reason) }); });

self.onmessage = async ({ data }) => {
  await runCode(data.code, emit, data.data);
  settled = true;
  finishIfIdle();
};
