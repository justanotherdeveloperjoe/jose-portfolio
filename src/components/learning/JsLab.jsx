import { useRef, useState } from 'react';
import { jsExamples } from '../../data/jsExamples.js';
import { runJs, TIME_LIMIT_MS } from '../../lib/runJs.js';
import { CodeEditor } from './CodeEditor.jsx';

const firstExample = Object.keys(jsExamples)[0];

// The JavaScript lab: edit the code, run it, see the real output. It runs in a sandbox off the page.
export function JsLab() {
  const [example, setExample] = useState(firstExample);
  const [code, setCode] = useState(jsExamples[firstExample]);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState('');
  const runCount = useRef(0);

  async function run() {
    if (running) return;
    const id = ++runCount.current;
    setRunning(true);
    setLines([]);
    setSummary('Running…');
    const result = await runJs(code, line => { if (runCount.current === id) setLines(current => [...current, line]); });
    if (runCount.current !== id) return;
    setRunning(false);
    if (result.stopped) {
      setLines(current => [...current, { kind: 'stopped', text: `Stopped after ${TIME_LIMIT_MS / 1000} seconds — it never finished on its own, so the sandbox ended it. The page never froze.` }]);
      setSummary(`Stopped after ${TIME_LIMIT_MS / 1000} seconds.`);
    } else {
      setSummary(result.lines ? `Ran in ${result.ms} ms · ${result.lines} line${result.lines === 1 ? '' : 's'} of output.` : `Ran in ${result.ms} ms. Nothing was printed — try console.log().`);
    }
  }
  function choose(name) {
    runCount.current++;
    setExample(name);
    setCode(jsExamples[name]);
    setLines([]);
    setRunning(false);
    setSummary('');
  }

  return <div className="learning-scene lab-scene">
    <div className="lab-window">
      <div className="lab-bar"><span aria-hidden="true">● ● ●</span><span>scratch.js</span><span>JS</span></div>
      <CodeEditor language="js" value={code} onChange={setCode} onRun={run} label="JavaScript code — edit it, then run it" />
      <div className="lab-output" data-state={running ? 'running' : lines.length ? 'done' : 'empty'}>
        {lines.length ? lines.map((line, i) => <div key={i} className={`lab-line is-${line.kind}`}><span aria-hidden="true">{line.kind === 'result' ? '←' : line.kind === 'error' ? '✕' : line.kind === 'stopped' ? '■' : '›'}</span>{line.text}</div>)
          : <div className="lab-line is-hint"><span aria-hidden="true">›</span>{running ? 'Running…' : 'Edit the code and press Run. It really runs — in a sandbox, off the page.'}</div>}
      </div>
    </div>
    <div className="lab-actions">
      <div className="lab-examples" role="group" aria-label="Start from an example">{Object.keys(jsExamples).map(name => <button key={name} type="button" aria-pressed={example === name} onClick={() => choose(name)}>{name}</button>)}</div>
      <button type="button" className="lab-run" onClick={run} aria-disabled={running}>{running ? 'Running…' : 'Run it'} <span aria-hidden="true">▶</span></button>
    </div>
    <p className="scene-caption" role="status">{summary || 'Real JavaScript, sandboxed: it can’t touch this page, and anything that runs too long is stopped.'}</p>
  </div>;
}
