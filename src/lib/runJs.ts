// Runs a snippet in a brand-new Web Worker and streams its console lines back. The worker can't reach the
// page, and it's terminated after the time limit no matter what — an endless loop just gets stopped.
import type { ConsoleLine } from './jsRunner.ts';

export interface RunJsResult {
  ms: number;
  stopped: boolean;
  lines: number;
}
export interface RunJsOptions {
  timeLimit?: number;
  data?: unknown;
}

// Messages the worker posts back (see jsRunner.worker.ts).
export type WorkerMessage = { type: 'line'; line: ConsoleLine } | { type: 'done' };

export const TIME_LIMIT_MS = 2000;
export const MAX_LINES = 200;

export function runJs(code: string, onLine: (line: ConsoleLine) => void, { timeLimit = TIME_LIMIT_MS, data = {} }: RunJsOptions = {}): Promise<RunJsResult> {
  return new Promise<RunJsResult>(resolve => {
    const worker = new Worker(new URL('./jsRunner.worker.ts', import.meta.url), { type: 'module' });
    const started = performance.now();
    let lines = 0, ended = false;
    const end = (stopped: boolean) => {
      if (ended) return;
      ended = true;
      clearTimeout(limit);
      worker.terminate();
      resolve({ ms: Math.round(performance.now() - started), stopped, lines });
    };
    const limit = setTimeout(() => end(true), timeLimit);
    worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if (data.type === 'line') {
        lines++;
        if (lines <= MAX_LINES) onLine(data.line);
        else if (lines === MAX_LINES + 1) onLine({ kind: 'warn', text: `… output stopped after ${MAX_LINES} lines` });
      } else if (data.type === 'done') end(false);
    };
    worker.onerror = event => { event.preventDefault(); onLine({ kind: 'error', text: event.message || 'The code could not run.' }); end(false); };
    worker.postMessage({ code, data });
  });
}
