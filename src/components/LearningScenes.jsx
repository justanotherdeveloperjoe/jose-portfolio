import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useSceneMotion } from '../hooks/useSceneMotion.js';
import './LearningScenes.css';

const terminalExamples = {
  Arrays: { code: 'const ideas = ["learn", "build", "improve"];\nideas.map(idea => `${idea} ↗`);', run: () => ['learn', 'build', 'improve'].map(idea => `${idea} ↗`).join('  ') },
  Async: { code: 'const message = await Promise.resolve("Ready!");\nconsole.log(message);', run: async () => await Promise.resolve('Ready!') },
  Events: { code: 'button.addEventListener("click", () => {\n  count += 1;\n});', run: count => `Click received. count = ${count}` },
};

function terminalMotion(select) {
  return gsap.timeline().fromTo(select('.terminal-code'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'steps(28)' })
    .fromTo(select('.terminal-output'), { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: .25 });
}
function atomMotion(select) {
  return gsap.timeline().fromTo(select('.react-orbits'), { rotation: -120, svgOrigin: '110 85' }, { rotation: 0, duration: 1.25, ease: 'power2.out' })
    .fromTo(select('.react-state-value'), { scale: .8 }, { scale: 1, duration: .45, ease: 'back.out(2)' }, 0);
}
function databaseMotion(select) {
  return gsap.timeline().fromTo(select('.database-layer'), { opacity: .15 }, { opacity: 1, duration: .25, stagger: .2 })
    .fromTo(select('.query-result-row'), { opacity: 0, x: 12 }, { opacity: 1, x: 0, stagger: .12, duration: .3 });
}
function botMotion(select) {
  return gsap.timeline().fromTo(select('.bot-head'), { rotation: -8, svgOrigin: '65 55' }, { rotation: 0, duration: .5, ease: 'back.out(3)' })
    .fromTo(select('.bot-file'), { x: -22, y: -8, opacity: 0 }, { x: 0, y: 0, opacity: 1, stagger: .18, duration: .5 }, .1)
    .fromTo(select('.bot-eye'), { scaleY: .15, transformOrigin: 'center' }, { scaleY: 1, duration: .15, repeat: 2, yoyo: true }, .8);
}
function weatherMotion(select) {
  return gsap.timeline().fromTo(select('.weather-cloud'), { y: -7 }, { y: 0, duration: .7, ease: 'sine.out' })
    .fromTo(select('.weather-particle'), { y: -8, opacity: 0 }, { y: 28, opacity: 1, stagger: .035, duration: .65, repeat: 1, ease: 'none' }, 0)
    .to(select('.weather-particle'), { opacity: 0, duration: .2 })
    .fromTo(select('.weather-sun'), { rotation: -35, svgOrigin: '164 35' }, { rotation: 0, duration: 1 }, 0);
}

function JavaScriptScene() {
  const ref = useRef(null);
  const runId = useRef(0);
  const [example, setExample] = useState('Arrays');
  const [output, setOutput] = useState('Your next idea starts here.');
  const [revision, setRevision] = useState(0);
  const [clicks, setClicks] = useState(0);
  useSceneMotion(ref, revision, terminalMotion);
  async function run() {
    const id = ++runId.current;
    const count = clicks + 1;
    const result = await terminalExamples[example].run(count);
    if (runId.current !== id) return;
    if (example === 'Events') setClicks(count);
    setOutput(result);
    setRevision(value => value + 1);
  }
  return <div className="learning-scene terminal-scene" ref={ref}>
    <div className="terminal-window"><div className="terminal-bar"><span aria-hidden="true">● ● ●</span><span>ideas.js</span><span>JS</span></div>
      <pre className="terminal-code"><code>{terminalExamples[example].code}</code></pre>
      <div className="terminal-output" aria-hidden="true"><span>›</span> {output}</div>
    </div>
    <div className="scene-actions"><label className="scene-select">Example<select value={example} onChange={event => { runId.current++; setExample(event.target.value); setOutput('Ready when you are.'); setRevision(0); }}>{Object.keys(terminalExamples).map(name => <option key={name}>{name}</option>)}</select></label><button type="button" onClick={run}>Run it <span aria-hidden="true">↗</span></button></div>
    <p className="scene-caption" role="status">{revision ? output : 'A small instruction. Something happens.'}</p>
  </div>;
}

function ReactScene() {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  useSceneMotion(ref, count, atomMotion);
  return <div className="learning-scene react-scene" ref={ref}>
    <div className="react-stage"><svg viewBox="0 0 220 170" aria-hidden="true"><g className="react-orbits" fill="none" stroke="currentColor" strokeWidth="1.5">{[0, 60, 120].map((angle, i) => <g key={angle} transform={`rotate(${angle} 110 85)`}><ellipse cx="110" cy="85" rx="76" ry="28" /><circle cx={i % 2 ? 34 : 186} cy="85" r="5" fill="currentColor" /></g>)}</g><circle cx="110" cy="85" r="10" fill="currentColor" /></svg>
      <div className="react-mini-ui"><span>LIVE PREVIEW</span><strong className="react-state-value">{count}</strong><span>state → render</span></div>
    </div>
    <div className="scene-actions"><code>count = {count}</code><button type="button" onClick={() => setCount(value => value + 1)}>Change state <span aria-hidden="true">+</span></button></div>
    <p className="scene-caption" role="status">{count ? `State is ${count}. The interface updated with it.` : 'One state change. A new view.'}</p>
  </div>;
}

const sampleProjects = [{ name: 'Studio', status: 'live' }, { name: 'Shop', status: 'draft' }, { name: 'Journal', status: 'live' }];
function SQLScene() {
  const ref = useRef(null);
  const [revision, setRevision] = useState(0);
  useSceneMotion(ref, revision, databaseMotion);
  const rows = revision ? sampleProjects.filter(row => row.status === 'live') : sampleProjects;
  return <div className="learning-scene sql-scene" ref={ref}>
    <div className="database-stage"><svg viewBox="0 0 120 145" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">{[0, 1, 2].map(i => <g key={i} className="database-layer" transform={`translate(0 ${i * 33})`}><path d="M18 25v28c0 18 84 18 84 0V25" fill="currentColor" fillOpacity=".12" /><ellipse cx="60" cy="25" rx="42" ry="14" /><circle cx="86" cy="47" r="3" fill="currentColor" /></g>)}</svg>
      <div className="query-results"><span>SAMPLE PROJECTS</span>{rows.map(row => <div className="query-result-row" key={row.name}><span>{row.name}</span><span>{row.status}</span></div>)}</div>
    </div>
    <code className="query-code">SELECT * FROM projects<br />WHERE status = 'live';</code>
    <div className="scene-actions"><span>{revision ? '2 matching rows' : '3 sample rows'}</span><button type="button" onClick={() => setRevision(value => value + 1)}>Run query <span aria-hidden="true">↗</span></button></div>
    <p className="scene-caption" role="status">{revision ? 'Studio and Journal match. Draft filtered out.' : 'Organize the data. Find what matters.'}</p>
  </div>;
}

const sampleFiles = [{ name: 'notes.txt', folder: 'Docs' }, { name: 'photo.jpg', folder: 'Images' }, { name: 'ideas.txt', folder: 'Docs' }];
function PythonScene() {
  const ref = useRef(null);
  const [revision, setRevision] = useState(0);
  useSceneMotion(ref, revision, botMotion);
  return <div className="learning-scene python-scene" ref={ref}>
    <div className={`bot-stage ${revision ? 'is-sorted' : ''}`}>
      <svg viewBox="0 0 130 160" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><g className="bot-head"><path d="M65 29V16" /><circle cx="65" cy="12" r="4" fill="currentColor" /><rect x="25" y="30" width="80" height="61" rx="17" fill="currentColor" fillOpacity=".08" /><rect className="bot-eye" x="42" y="48" width="8" height="12" rx="4" fill="currentColor" /><rect className="bot-eye" x="80" y="48" width="8" height="12" rx="4" fill="currentColor" /><path d={revision ? 'M51 72q14 13 28 0' : 'M53 75h24'} /></g><rect x="37" y="98" width="56" height="37" rx="9" /><path d="m28 104-9 16m83-16 9 16M48 135v12m34-12v12" /><path d="m58 111 7 7 10-13" /></svg>
      <div className="bot-files"><span>{revision ? 'SORTED BY TYPE' : 'SAMPLE FILES'}</span>{revision ? ['Docs', 'Images'].map(folder => <div className="bot-folder" key={folder}><b>{folder}/</b>{sampleFiles.filter(file => file.folder === folder).map(file => <span className="bot-file" key={file.name}>{file.name}</span>)}</div>) : sampleFiles.map(file => <span className="bot-file loose-file" key={file.name}>{file.name}</span>)}</div>
    </div>
    <div className="scene-actions"><span>{revision ? 'Task complete ✓' : 'A little helper'}</span><button type="button" onClick={() => setRevision(value => value + 1)}>{revision ? 'Run again' : 'Give it a task'} <span aria-hidden="true">↗</span></button></div>
    <p className="scene-caption" role="status">{revision ? '3 sample files sorted into Docs and Images.' : 'A playful look at what a sorting script can do.'}</p>
  </div>;
}

function AWSScene() {
  const ref = useRef(null);
  const [weather, setWeather] = useState('Sun');
  const [revision, setRevision] = useState(0);
  useSceneMotion(ref, revision, weatherMotion);
  return <div className={`learning-scene aws-scene weather-${weather.toLowerCase()}`} ref={ref}>
    <div className="weather-stage"><svg viewBox="0 0 240 170" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <g className="weather-sun"><circle cx="164" cy="35" r="17" fill="#efc86f" stroke="none" />{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M164 8v-6" transform={`rotate(${angle} 164 35)`} />)}</g>
      <path className="weather-cloud" d="M77 80a22 22 0 0 1-2-44 33 33 0 0 1 64-6 26 26 0 1 1 14 50Z" fill="currentColor" fillOpacity=".12" />
      {weather !== 'Sun' && <g className="weather-particles">{[0, 1, 2, 3, 4, 5].map(i => weather === 'Rain' ? <path className="weather-particle" key={i} d={`M${77 + i * 16} ${85 + i % 2 * 8}l-3 8`} /> : <g className="weather-particle" key={i}><path d={`M${77 + i * 16} ${85 + i % 2 * 8}v7m-3.5-3.5h7`} /></g>)}</g>}
      <path className="weather-connections" d="M120 90v26M45 134v-18h150v18M120 116v18" strokeDasharray="3 4" />
      {[45, 120, 195].map(x => <rect key={x} x={x - 12} y="134" width="24" height="23" rx="4" fill="currentColor" fillOpacity=".07" />)}
      {weather === 'Snow' && <path className="weather-snowbank" d="M22 160q24-8 49 0t49 0 49 0 49 0" stroke="#fff8eb" strokeWidth="5" />}
    </svg><div className="weather-services"><span>Compute</span><span>Storage</span><span>Network</span></div></div>
    <div className="weather-controls" role="group" aria-label="Cloud scene weather">{['Sun', 'Rain', 'Snow'].map(option => <button type="button" key={option} aria-pressed={weather === option} onClick={() => { setWeather(option); setRevision(value => value + 1); }}>{option}</button>)}</div>
    <p className="scene-caption" role="status">{weather} in this little cloud world. Connected services underneath.</p>
  </div>;
}

const scenes = { javascript: JavaScriptScene, react: ReactScene, data: SQLScene, code: PythonScene, cloud: AWSScene };
export function LearningScene({ kind }) {
  const Scene = scenes[kind];
  return <Scene />;
}
