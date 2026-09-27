import { useState } from 'react';

const buildings = [
  { x: 22, y: 227, w: 28, h: 48 }, { x: 57, y: 208, w: 35, h: 67 },
  { x: 100, y: 239, w: 22, h: 36 }, { x: 133, y: 185, w: 32, h: 90 },
  { x: 174, y: 221, w: 40, h: 54 }, { x: 225, y: 203, w: 29, h: 72 },
  { x: 268, y: 235, w: 34, h: 40 }, { x: 310, y: 159, w: 25, h: 116 },
  { x: 346, y: 218, w: 34, h: 57 }, { x: 391, y: 238, w: 29, h: 37 },
];

export function MonterreyPostcard({ time }) {
  const [mode, setMode] = useState('Auto');
  const hour = Number(time.split(':')[0]);
  const isNight = mode === 'Night' || (mode === 'Auto' && (hour < 7 || hour >= 19));

  return <figure className={`studio-postcard ${isNight ? 'is-night' : 'is-day'}`} id="monterrey">
    <div className="postcard-topline"><span>A little piece of home.</span><span aria-hidden="true">↗</span></div>
    <svg className="postcard-scene" viewBox="0 0 440 300" role="img" aria-label={`An illustrated Monterrey skyline and mountain silhouette at ${isNight ? 'night' : 'day'}`}>
      <rect className="postcard-sky" width="440" height="300" />
      <g className="postcard-stars" fill="#ebe3b7">{[[43, 52], [112, 29], [190, 74], [239, 38], [292, 85], [371, 34], [400, 103], [77, 99]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 2} />)}<path d="M162 39v10m-5-5h10" stroke="#ebe3b7" /></g>
      <circle className="postcard-sun" cx="337" cy="75" r="28" />
      <path className="postcard-moon" d="M349 44a28 28 0 1 0 12 47 30 30 0 0 1-12-47Z" />
      <g className="postcard-clouds" fill="none" strokeLinecap="round" strokeWidth="3"><path d="M39 82h47m-27 8h57M228 47h37m-17 9h48" /></g>
      <path className="postcard-mountain-back" d="m0 192 43-25 33 10 58-78 37 23 40-51 35 25 31 60 35 21 26-27 39 40 63-14v124H0Z" />
      <path className="postcard-mountain-front" d="m0 236 53-42 28 12 65-67 27-16 31 36 26 4 43-44 22 16 27 68 42 5 42 38 34-14v68H0Z" />
      <path className="postcard-ridge" d="m81 206 65-67 27-16 31 36 26 4 43-44 22 16" fill="none" strokeWidth="1" />
      <g className="postcard-buildings">{buildings.map((building, index) => <g key={building.x}><rect x={building.x} y={building.y} width={building.w} height={building.h} rx="1" />{index === 7 && <path d="M322 141v18" stroke="currentColor" strokeWidth="2" />}{Array.from({ length: Math.floor(building.h / 17) }).map((_, row) => <g className="postcard-windows" key={row}><rect x={building.x + 6} y={building.y + 9 + row * 15} width="4" height="5" /><rect x={building.x + building.w - 10} y={building.y + 9 + row * 15} width="4" height="5" /></g>)}</g>)}</g>
      <path className="postcard-ground" d="M0 275h440v25H0Z" /><path d="M20 287h65m12 0h38m110 0h63m13 0h99" className="postcard-street" fill="none" strokeWidth="1" />
    </svg>
    <figcaption><div className="postcard-location"><span>MONTERREY, MX</span><span>{time} <i aria-hidden="true" /></span></div><div className="postcard-controls" role="group" aria-label="Monterrey scene lighting">{['Auto', 'Day', 'Night'].map(option => <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>{option}</button>)}</div><p className="postcard-caption">{mode === 'Auto' ? 'Following local hours. Day from 07:00 to 19:00.' : `${mode} preview. Switch to Auto to follow local time.`}</p></figcaption>
  </figure>;
}
