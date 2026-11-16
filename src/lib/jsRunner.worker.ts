// Runs one visitor snippet, off the page. A fresh worker is made for every run and thrown away after,
// so nothing carries over between runs, and the page can stop it at any moment (see runJs.js).
import { runCode, describeError } from './jsRunner.ts';
import type { ConsoleLine } from './jsRunner.ts';
import type { WorkerMessage } from './runJs.ts';

// This module only ever runs as a dedicated worker, so `self` is the worker scope, not a Window.
declare const self: DedicatedWorkerGlobalScope;

const send = (message: WorkerMessage) => self.postMessage(message);
const emit = (line: ConsoleLine) => send({ type: 'line', line });

// Count pending timers, so the run is "done" only once the code AND any setTimeout it started have finished.
const pending = new Set<number | undefined>();
let settled = false;
const finishIfIdle = () => { if (settled && pending.size === 0) send({ type: 'done' }); };
const native = { setTimeout: self.setTimeout.bind(self), clearTimeout: self.clearTimeout.bind(self), setInterval: self.setInterval.bind(self), clearInterval: self.clearInterval.bind(self) };
const guarded = (callback: TimerHandler) => (...args: unknown[]) => { try { if (typeof callback === 'function') callback(...args); } catch (error) { emit({ kind: 'error', text: describeError(error) }); } };

self.setTimeout = (callback, ms, ...args) => {
  const id = native.setTimeout(() => { pending.delete(id); guarded(callback)(...args); finishIfIdle(); }, ms);
  pending.add(id);
  return id;
};
self.clearTimeout = id => { pending.delete(id); native.clearTimeout(id); finishIfIdle(); };
self.setInterval = (callback, ms, ...args) => { const id = native.setInterval(guarded(callback), ms, ...args); pending.add(id); return id; };
self.clearInterval = id => { pending.delete(id); native.clearInterval(id); finishIfIdle(); };
self.addEventListener('unhandledrejection', event => { event.preventDefault(); emit({ kind: 'error', text: describeError(event.reason) }); });

self.onmessage = async ({ data }: MessageEvent<{ code: string; data: unknown }>) => {
  await runCode(data.code, emit, data.data);
  settled = true;
  finishIfIdle();
};
