import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useSceneMotion } from '../hooks/useSceneMotion.js';
import { JsLab } from './learning/JsLab.jsx';
import { SqlLab } from './learning/SqlLab.jsx';
import './LearningScenes.css';
import './learning/LearningLab.css';

function atomMotion(select) {
  return gsap.timeline().fromTo(select('.react-orbits'), { rotation: -120, svgOrigin: '110 85' }, { rotation: 0, duration: 1.25, ease: 'power2.out' })
    .fromTo(select('.react-state-value'), { scale: .8 }, { scale: 1, duration: .45, ease: 'back.out(2)' }, 0);
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

// JavaScript and SQL are real (they run what you type); React, Python and AWS are illustrated scenes.
const scenes = { javascript: JsLab, react: ReactScene, data: SqlLab, code: PythonScene, cloud: AWSScene };
export function LearningScene({ kind }) {
  const Scene = scenes[kind];
  return <Scene />;
}
