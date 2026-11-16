import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

// An isometric city built from the page's own sections. Every building is a
// link: hovering lifts it and shows its label, clicking flies the camera
// toward it and then scrolls to the real section below. Trees, props and
// cars are CC0 sprites from Kenney (see public/city/LICENSE.txt), drawn as
// billboards standing on the ground plane.

export type CityBlock = {
  id: string;
  label: string;
  note: string;
  kind: 'tower' | 'shop' | 'house' | 'lab' | 'arcade' | 'computer' | 'antenna';
  x: number; y: number; w: number; d: number; h: number;
  color: string;
};

export const cityBlocks: CityBlock[] = [
  { id: 'work', label: 'Work', note: 'Selected projects', kind: 'tower', x: 56, y: 52, w: 126, d: 126, h: 236, color: '#e9e7dd' },
  { id: 'services', label: 'Services', note: 'Plans and pricing', kind: 'shop', x: 236, y: 48, w: 140, d: 104, h: 86, color: '#d5f77a' },
  { id: 'contact', label: 'Contact', note: 'Say hello', kind: 'antenna', x: 440, y: 58, w: 66, d: 66, h: 148, color: '#dcdad0' },
  { id: 'learning', label: 'Learning', note: 'Live labs', kind: 'lab', x: 56, y: 236, w: 128, d: 100, h: 66, color: '#9fc3b2' },
  { id: 'about', label: 'About', note: 'Behind the browser', kind: 'house', x: 250, y: 222, w: 104, d: 104, h: 78, color: '#3d7a62' },
  { id: 'playground', label: 'Playground', note: 'Arcade and toys', kind: 'arcade', x: 420, y: 226, w: 100, d: 112, h: 122, color: '#2a2d28' },
  { id: 'sandbox', label: 'Sandbox', note: 'A Linux desktop', kind: 'computer', x: 236, y: 404, w: 132, d: 92, h: 58, color: '#596158' },
];

type Sprite = { src: string; x: number; y: number; w: number };
// Ground coordinates; w is the drawn width in ground pixels. Bottom-center anchored.
const sprites: Sprite[] = [
  { src: 'tree-1', x: 22, y: 26, w: 58 }, { src: 'tree-3', x: 210, y: 18, w: 54 }, { src: 'pine-1', x: 404, y: 26, w: 50 },
  { src: 'tree-2', x: 536, y: 150, w: 56 }, { src: 'bush-1', x: 520, y: 118, w: 34 },
  { src: 'tree-4', x: 26, y: 392, w: 60 }, { src: 'bush-2', x: 60, y: 370, w: 34 }, { src: 'pine-2', x: 186, y: 448, w: 48 },
  { src: 'tree-1', x: 404, y: 420, w: 56 }, { src: 'tree-2', x: 536, y: 470, w: 56 }, { src: 'bush-1', x: 470, y: 400, w: 32 },
  { src: 'monument', x: 330, y: 372, w: 40 }, { src: 'rock', x: 24, y: 180, w: 36 }, { src: 'bush-2', x: 230, y: 176, w: 30 },
  { src: 'lamp-2', x: 232, y: 232, w: 14 }, { src: 'lamp-2', x: 232, y: 350, w: 14 }, { src: 'lamp-3', x: 384, y: 232, w: 14 },
  { src: 'lamp-3', x: 384, y: 360, w: 14 }, { src: 'lamp-1', x: 188, y: 232, w: 14 }, { src: 'lamp-4', x: 420, y: 180, w: 14 },
  { src: 'bus-stop', x: 300, y: 180, w: 26 },
];

// Small anonymous buildings that fill the blocks around the landmarks.
type Filler = { x: number; y: number; w: number; d: number; h: number; c: string };
const palette = ['#4a4e45', '#5b5f55', '#6b6f64', '#8a8d84', '#3f4a3e', '#7a8a6a'];
const fillerSeed: [number, number, number, number, number][] = [
  // top strip (y 0..90)
  [8, 6, 44, 40, 34], [60, 10, 36, 36, 52], [104, 4, 48, 44, 28], [160, 8, 40, 40, 46], [210, 6, 50, 36, 30], [268, 12, 36, 40, 60],
  [352, 8, 44, 36, 38], [404, 4, 40, 44, 26], [454, 10, 48, 40, 48], [512, 6, 36, 36, 32], [556, 8, 42, 44, 58], [606, 4, 48, 40, 30], [662, 10, 44, 36, 44], [714, 6, 40, 40, 36],
  // left strip (x 0..90)
  [6, 108, 40, 44, 42], [8, 160, 44, 40, 28], [4, 212, 36, 48, 56], [10, 420, 44, 40, 34], [6, 470, 40, 44, 48], [8, 522, 44, 40, 30], [4, 574, 40, 48, 44], [10, 626, 44, 40, 36], [6, 678, 40, 44, 26], [8, 722, 44, 34, 40],
  // right strip (x 660..760)
  [664, 108, 44, 40, 30], [712, 112, 42, 44, 46], [668, 164, 40, 40, 38], [716, 168, 40, 44, 24], [670, 420, 44, 40, 52], [716, 426, 40, 44, 32], [666, 474, 42, 40, 28], [714, 480, 44, 44, 44], [670, 528, 40, 40, 36], [716, 534, 42, 44, 26], [668, 584, 44, 40, 48], [714, 590, 40, 44, 34], [672, 640, 40, 40, 30], [716, 646, 42, 44, 40], [668, 700, 44, 48, 26],
  // bottom strip (y 660..760)
  [104, 664, 44, 40, 34], [156, 668, 40, 44, 48], [210, 662, 48, 40, 28], [266, 670, 40, 44, 40], [420, 664, 44, 40, 52], [472, 668, 40, 44, 30], [526, 662, 48, 40, 36], [582, 670, 40, 44, 44], [104, 716, 40, 38, 30], [160, 712, 44, 42, 26], [214, 716, 40, 38, 38], [420, 712, 44, 42, 28], [476, 716, 40, 38, 46], [530, 712, 44, 42, 32], [586, 716, 40, 38, 24],
  // inner gaps
  [120, 520, 40, 36, 24], [160, 480, 36, 40, 30], [440, 540, 36, 40, 22], [580, 300, 40, 36, 26], [610, 560, 36, 36, 28],
];
const fillers: Filler[] = fillerSeed.map(([x, y, w, d, h], i) => ({ x, y, w, d, h, c: palette[(i * 7) % palette.length] }));

// Residents: tiny walkers on the sidewalks (ground coords, path length and duration).
type Walker = { x: number; y: number; axis: 'x' | 'y'; len: number; dur: number; delay: number; shirt: string };
const walkers: Walker[] = [
  { x: 100, y: 280, axis: 'x', len: 560, dur: 38, delay: 0, shirt: '#e9e7dd' },
  { x: 660, y: 328, axis: 'x', len: -560, dur: 44, delay: 6, shirt: '#d5f77a' },
  { x: 290, y: 100, axis: 'y', len: 560, dur: 40, delay: 2, shirt: '#9fc3b2' },
  { x: 332, y: 660, axis: 'y', len: -560, dur: 36, delay: 11, shirt: '#f0a8b8' },
  { x: 482, y: 120, axis: 'y', len: 520, dur: 42, delay: 5, shirt: '#e9e7dd' },
  { x: 524, y: 640, axis: 'y', len: -520, dur: 39, delay: 14, shirt: '#d5f77a' },
  { x: 140, y: 420, axis: 'x', len: 140, dur: 16, delay: 3, shirt: '#8ab4d6' },
  { x: 340, y: 500, axis: 'x', len: 120, dur: 14, delay: 8, shirt: '#e9e7dd' },
  { x: 380, y: 470, axis: 'x', len: -120, dur: 15, delay: 1, shirt: '#f0c070' },
  { x: 560, y: 420, axis: 'y', len: 100, dur: 12, delay: 7, shirt: '#9fc3b2' },
  { x: 200, y: 300, axis: 'x', len: 300, dur: 24, delay: 9, shirt: '#d5f77a' },
  { x: 620, y: 290, axis: 'x', len: -300, dur: 26, delay: 4, shirt: '#e9e7dd' },
];

type IsoCityProps = { facades?: string[] };

// Landmarks and sprites were laid out on a 560 grid; the world is now 760 with them centred.
const O = 100;

export function IsoCity({ facades = [] }: IsoCityProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [fly, setFly] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // The stage is always mounted before this effect runs.
    const element = stage.current!;
    const observer = new ResizeObserver(([entry]) => setScale(Math.max(0.3, entry.contentRect.width / 1110)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function visit(event: MouseEvent<HTMLAnchorElement>, block: CityBlock) {
    const target = document.getElementById(block.id);
    if (!target) return; // let the browser follow the hash
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !stage.current) {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${block.id}`);
      return;
    }
    const bounds = stage.current.getBoundingClientRect();
    const roof = event.currentTarget.querySelector<HTMLElement>('.iso-top')!.getBoundingClientRect();
    setFly({ x: bounds.left + bounds.width / 2 - (roof.left + roof.width / 2), y: bounds.top + bounds.height / 2 - (roof.top + roof.height / 2) });
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', `#${block.id}`);
    }, 520);
    window.setTimeout(() => setFly(null), 1500);
  }

  const mini = (className: string, x: number, y: number, w: number, d: number, h: number, color: string) =>
    <i className={`iso-mini ${className}`} aria-hidden="true" style={{ '--x': `${x}px`, '--y': `${y}px`, '--w': `${w}px`, '--d': `${d}px`, '--h': `${h}px`, '--c': color } as CSSProperties}>
      <i className="iso-face iso-top" /><i className="iso-face iso-front" /><i className="iso-face iso-side" />
    </i>;

  return <div className={`iso-stage ${fly ? 'is-flying' : ''}`} ref={stage} style={{ '--iso-s': scale, '--fly-x': `${fly?.x ?? 0}px`, '--fly-y': `${fly?.y ?? 0}px` } as CSSProperties}>
    <div className="iso-camera">
      <div className="iso-world">
        <div className="iso-ground" aria-hidden="true">
          <i className="iso-road iso-road-h" />
          <i className="iso-road iso-road-v iso-road-v1" />
          <i className="iso-road iso-road-v iso-road-v2" />
          <i className="iso-road iso-road-h iso-road-h2" />
          <i className="iso-road iso-road-v iso-road-v3" />
          <i className="iso-road iso-road-v iso-road-v4" />
          <i className="iso-plaza" />
          <i className="iso-cloud" />
          {cityBlocks.map(block => <i key={block.id} className="iso-shadow" style={{ '--x': `${block.x + O}px`, '--y': `${block.y + O}px`, '--w': `${block.w}px`, '--d': `${block.d}px`, '--h': `${block.h}px` } as CSSProperties} />)}
          {fillers.map((f, i) => <i key={`f${i}`} className="iso-shadow" style={{ '--x': `${f.x}px`, '--y': `${f.y}px`, '--w': `${f.w}px`, '--d': `${f.d}px`, '--h': `${f.h}px` } as CSSProperties} />)}
        </div>
        <div className="iso-props" aria-hidden="true">
          {sprites.map((sprite, index) => <i key={index} className="iso-sprite" style={{ '--x': `${sprite.x + O}px`, '--y': `${sprite.y + O}px`, '--w': `${sprite.w}px`, '--i': index } as CSSProperties}><img src={`/city/${sprite.src}.png`} alt="" loading="lazy" /></i>)}
          <i className="iso-sprite iso-car iso-car-a"><img src="/city/car-red4-15.png" alt="" /></i>
          <i className="iso-sprite iso-car iso-car-b"><img src="/city/car-silver2-07.png" alt="" /></i>
          <i className="iso-sprite iso-car iso-car-c"><img src="/city/car-black6-11.png" alt="" /></i>
        </div>
        <div className="iso-fillers" aria-hidden="true">
          {fillers.map((f, i) => <i key={i} className="iso-box iso-filler" style={{ '--x': `${f.x}px`, '--y': `${f.y}px`, '--w': `${f.w}px`, '--d': `${f.d}px`, '--h': `${f.h}px`, '--c': f.c, '--i': (i % 9) + 2 } as CSSProperties}>
            <i className="iso-face iso-top" /><i className="iso-face iso-front" /><i className="iso-face iso-side" />
          </i>)}
        </div>
        <div className="iso-residents" aria-hidden="true">
          {walkers.map((p, i) => <i key={i} className={`iso-walker iso-walk-${p.axis}`} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--len': `${p.len}px`, '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--shirt': p.shirt } as CSSProperties}><i /></i>)}
        </div>
        <nav className="iso-blocks" aria-label="City map of this page">
          {cityBlocks.map((block, index) => <a
            key={block.id}
            href={`#${block.id}`}
            className={`iso-box iso-${block.kind}`}
            style={{ '--x': `${block.x + O}px`, '--y': `${block.y + O}px`, '--w': `${block.w}px`, '--d': `${block.d}px`, '--h': `${block.h}px`, '--c': block.color, '--i': index } as CSSProperties}
            onClick={event => visit(event, block)}
          >
            <span className="iso-face iso-top" aria-hidden="true">
              {block.kind === 'tower' && <i className="iso-helipad">H</i>}
              {block.kind === 'lab' && <i className="iso-glassroof" />}
              {block.kind === 'house' && <><i className="iso-slope iso-slope-a" /><i className="iso-slope iso-slope-b" /></>}
            </span>
            <span className="iso-face iso-front" aria-hidden="true">
              {block.kind === 'tower' && <>{facades.slice(0, 3).map((src, i) => <img key={i} src={src} alt="" className="iso-billboard" style={{ '--n': i } as CSSProperties} loading="lazy" />)}<i className="iso-sheen" /></>}
              {block.kind === 'shop' && <><i className="iso-marquee" /><i className="iso-storefront" /><i className="iso-door iso-door-shop" /></>}
              {block.kind === 'arcade' && <><i className="iso-neon">PLAY</i><i className="iso-door iso-door-arcade" /><i className="iso-edge iso-edge-v" /><i className="iso-edge iso-edge-h" /></>}
              {block.kind === 'house' && <><i className="iso-door" /><i className="iso-window" /><i className="iso-window iso-window-2" /></>}
              {block.kind === 'lab' && <i className="iso-glass" />}
              {block.kind === 'antenna' && <i className="iso-sheen" />}
            </span>
            <span className="iso-face iso-side" aria-hidden="true">
              {block.kind === 'house' && <i className="iso-gable" />}
              {block.kind === 'arcade' && <i className="iso-edge iso-edge-h" />}
              {block.kind === 'tower' && <i className="iso-sheen" />}
            </span>
            {block.kind === 'tower' && <>{mini('iso-crown', 28, 28, 70, 70, 58, '#f0eee6')}{mini('iso-ac', 8, 100, 18, 16, 10, '#b9b7ad')}<i className="iso-spire" aria-hidden="true" /><i className="iso-roofsign" aria-hidden="true">js<b>*</b></i></>}
            {block.kind === 'shop' && <>{mini('iso-canopy', 16, 104, 108, 16, 4, '#4c5c2a')}{mini('iso-ac', 100, 14, 24, 20, 12, '#aebd6c')}<i className="iso-roofsign iso-roofsign-box" aria-hidden="true">PRICING</i></>}
            {block.kind === 'house' && <>{mini('iso-chimney', 70, 22, 14, 14, 44, '#2f5c4a')}<i className="iso-smoke" aria-hidden="true"><i /><i /><i /></i></>}
            {block.kind === 'lab' && <i className="iso-roofsign iso-roofsign-box iso-roofsign-lab" aria-hidden="true">LAB 04</i>}
            {block.kind === 'arcade' && <>{mini('iso-joystick', 36, 40, 28, 28, 10, '#44483f')}<i className="iso-ball" aria-hidden="true" /><i className="iso-roofsign iso-roofsign-arcade" aria-hidden="true">ARCADE</i></>}
            {block.kind === 'antenna' && <i className="iso-mast" aria-hidden="true"><i className="iso-dish" /><i className="iso-beacon" /><i className="iso-ring" /><i className="iso-ring" /><i className="iso-ring" /></i>}
            {block.kind === 'computer' && <>{mini('iso-keys', 26, 56, 80, 20, 4, '#bfc3b8')}<i className="iso-monitor" aria-hidden="true"><i className="iso-face iso-top" /><i className="iso-face iso-front"><i className="iso-term" /></i><i className="iso-face iso-side" /></i></>}
            <span className="iso-label"><b>{block.label}</b><small>{block.note}</small></span>
          </a>)}
        </nav>
      </div>
    </div>
    <p className="iso-caption"><span>CITY MAP / 07 DISTRICTS / {walkers.length} RESIDENTS</span><span className="iso-caption-hover">Hover a building. Click to visit.</span><span className="iso-caption-touch">Tap a building to visit.</span></p>
  </div>;
}
