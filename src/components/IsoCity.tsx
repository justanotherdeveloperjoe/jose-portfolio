import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { citySprites } from '../data/citySprites.ts';
import { ROADS, ROAD_LINES, createTraffic, spriteAngle } from './cityTraffic.ts';
import type { RoadLine } from './cityTraffic.ts';
import { O, SPUR_LINES, WORLD, cityBlocks, commercial, fillers, holidayCore, industrial, nature, parked, pocketParkProps, pocketParks, standing, townTree, suburbYards, suburbsFar, suburbsNear, walkRoutes, walkers, woods } from '../data/cityLayout.ts';
import type { CityBlock, Placed } from '../data/cityLayout.ts';

// An isometric city built from the page's own sections (layout in data/cityLayout.ts). The landmarks are links:
// hovering lifts one and shows its label, clicking flies the camera toward it and
// then scrolls to the real section below. Around downtown sit an industrial
// district, a parking lot and forest outskirts, drawn with Kenney CC0 models that
// were rendered at this city's camera angle (public/city/k, see public/city/LICENSE.txt).

// Residents: Kenney Mini Characters rendered as walk (6 frames) and idle (4 frames)
// strips in four directions (public/city/people). Frames are 43px at 36px per model
// unit; PERSON sets how many ground px a model unit takes on the page.
const PERSON = 13;
const FRAME = 43, ANCHOR = { x: 21.6, y: 35.1 }, BAKE_PPU = 36;
const personScale = PERSON / BAKE_PPU;
const personSize = { w: FRAME * personScale, ax: ANCHOR.x * personScale, ay: ANCHOR.y * personScale, g: 0.22 * PERSON };
const personUrl = (who: string, clip: 'walk' | 'idle', dir: number) => `/city/people/${who}-${clip}-${dir}.png`;
const facing = (heading: number) => (Math.round(heading / 90) * 90) % 360;

const trafficModels = ['car-sedan', 'car-taxi', 'car-suv', 'car-van', 'car-delivery', 'car-hatchback-sports', 'car-taxi', 'car-sedan'];

// Junction pads where road lines cross. Crosswalk stripes are drawn only where the
// vertical road actually continues north or south of the junction.
const allLines: RoadLine[] = [...ROAD_LINES, ...SPUR_LINES];
const junctions = (() => {
  const hs = allLines.filter(l => l.axis === 'h'), vs = allLines.filter(l => l.axis === 'v');
  const seen = new Set<string>(), out: { x: number; y: number; n: boolean; s: boolean }[] = [];
  for (const h of hs) for (const v of vs) {
    if (v.at < h.from || v.at > h.to || h.at < v.from || h.at > v.to) continue;
    const key = `${v.at},${h.at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const onV = vs.filter(l => l.at === v.at);
    out.push({ x: v.at, y: h.at, n: onV.some(l => l.from < h.at), s: onV.some(l => l.to > h.at) });
  }
  return out;
})();
const spriteUrl = (name: string) => `/city/k/${name}.png`;

function spriteStyle(name: string, x: number, y: number, index = 0): CSSProperties {
  const m = citySprites[name];
  return { '--x': `${x + m.gx}px`, '--y': `${y + m.gy}px`, '--w': `${m.w}px`, '--h': `${m.h}px`, '--ax': `${m.ax}px`, '--ay': `${m.ay}px`, '--i': index } as CSSProperties;
}
// Static sprites are a single billboarded image (one 3D layer each). Outer rings use
// copies with their dimming baked in (name.c/.p/.s/.f.png) instead of CSS filters,
// which would cost a filter pass per sprite on every frame.
type Tone = 'c' | 'p' | 's' | 'f';
const Sprite = ({ item: [name, x, y], index, tone, still }: { item: Placed; index: number; tone?: Tone; still?: boolean }) =>
  <img className={`iso-kimg${still ? ' is-still' : ''}`} style={spriteStyle(name, x, y, index)} src={tone ? `/city/k/${name}.${tone}.png` : spriteUrl(name)} alt="" loading="lazy" decoding="async" />;

type IsoCityProps = { facades?: string[] };

export function IsoCity({ facades = [] }: IsoCityProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [fly, setFly] = useState<{ x: number; y: number } | null>(null);
  // Lighter traffic on small screens.
  const [small] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const traffic = small ? trafficModels.slice(0, 4) : trafficModels;
  const residents = small ? walkers.slice(0, 3) : walkers;
  const carEls = useRef<(HTMLElement | null)[]>([]);
  const pedEls = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // The stage is always mounted before this effect runs.
    const element = stage.current!;
    const observer = new ResizeObserver(([entry]) => setScale(Math.max(0.3, entry.contentRect.width / 1110)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Traffic: a light simulation drawn straight to the DOM each frame. It pauses
  // while the city is off screen or the tab is hidden, and stays parked for
  // visitors who prefer reduced motion.
  useEffect(() => {
    const sim = createTraffic(traffic, Math.random, residents.map(w => ({ ...walkRoutes.find(r => r.name === w.route)!, ...w })));
    const draw = () => {
      sim.cars.forEach((car, i) => {
      const el = carEls.current[i];
      if (!el) return;
      const key = `${car.sprite}-${spriteAngle(car.heading)}`;
      const m = citySprites[key];
      el.style.transform = `translate3d(${(car.pos.x + m.gx).toFixed(2)}px, ${(car.pos.y + m.gy).toFixed(2)}px, 0.6px)`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.style.setProperty('--w', `${m.w}px`); el.style.setProperty('--h', `${m.h}px`);
        el.style.setProperty('--ax', `${m.ax}px`); el.style.setProperty('--ay', `${m.ay}px`);
        (el.firstElementChild as HTMLImageElement).src = spriteUrl(key);
      }
    });
      sim.peds.forEach((ped, i) => {
      const el = pedEls.current[i];
      if (!el) return;
      el.style.transform = `translate3d(${(ped.pos.x + personSize.g).toFixed(2)}px, ${(ped.pos.y + personSize.g).toFixed(2)}px, 0.6px)`;
      const clip = ped.walking ? 'walk' : 'idle';
      const key = `${clip}-${facing(ped.heading)}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.classList.toggle('is-walk', ped.walking);
        el.classList.toggle('is-idle', !ped.walking);
        (el.firstElementChild as HTMLElement).style.backgroundImage = `url(${personUrl(ped.who, clip, facing(ped.heading))})`;
      }
    });
    };
    draw();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Warm the cache with every heading so turns never flash.
    traffic.forEach(model => { for (let a = 0; a < 360; a += 45) new Image().src = spriteUrl(`${model}-${a}`); });
    residents.forEach(w => { for (let a = 0; a < 360; a += 90) { new Image().src = personUrl(w.who, 'walk', a); new Image().src = personUrl(w.who, 'idle', a); } });
    let raf = 0, last = 0, visible = false;
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      sim.update(last ? (now - last) / 1000 : 0);
      last = now;
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    io.observe(stage.current!);
    document.addEventListener('visibilitychange', start);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', start); if (raf) cancelAnimationFrame(raf); };
  }, [small]); // eslint-disable-line react-hooks/exhaustive-deps

  function visit(event: MouseEvent<HTMLAnchorElement>, block: CityBlock) {
    const target = document.getElementById(block.target);
    if (!target) return; // let the browser follow the hash
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !stage.current) {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${block.target}`);
      return;
    }
    const bounds = stage.current.getBoundingClientRect();
    const roof = event.currentTarget.querySelector<HTMLElement>('.iso-top')!.getBoundingClientRect();
    setFly({ x: bounds.left + bounds.width / 2 - (roof.left + roof.width / 2), y: bounds.top + bounds.height / 2 - (roof.top + roof.height / 2) });
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', `#${block.target}`);
    }, 520);
    window.setTimeout(() => setFly(null), 1500);
  }

  const mini = (className: string, x: number, y: number, w: number, d: number, h: number, color: string) =>
    <i className={`iso-mini ${className}`} aria-hidden="true" style={{ '--x': `${x}px`, '--y': `${y}px`, '--w': `${w}px`, '--d': `${d}px`, '--h': `${h}px`, '--c': color } as CSSProperties}>
      <i className="iso-face iso-top" /><i className="iso-face iso-front" /><i className="iso-face iso-side" />
    </i>;

  const { half } = ROADS;
  return <div className={`iso-stage ${fly ? 'is-flying' : ''}`} ref={stage} style={{ '--iso-s': scale, '--fly-x': `${fly?.x ?? 0}px`, '--fly-y': `${fly?.y ?? 0}px` } as CSSProperties}>
    <div className="iso-camera">
      <div className="iso-world">
        <div className="iso-outer-ground" aria-hidden="true" style={{ left: WORLD.from, top: WORLD.from, width: WORLD.to - WORLD.from, height: WORLD.to - WORLD.from }}>
          <i className="iso-belt" style={{ left: -126 - WORLD.from, top: -126 - WORLD.from, width: 1012, height: 1012 }} />
          {pocketParks.map(([x, y]) => <i key={`${x},${y}`} className="iso-pocket" style={{ left: x - 36 - WORLD.from, top: y - 34 - WORLD.from, width: 72, height: 68 }} />)}
        </div>
        <div className="iso-ground" aria-hidden="true">
          <i className="iso-zone iso-zone-industrial" style={{ left: 0, top: 96, width: 86, height: 664 }} />
          <i className="iso-zone iso-zone-industrial" style={{ left: 86, top: 657, width: 225, height: 103 }} />
          <i className="iso-zone iso-zone-green" style={{ left: 670, top: 96, width: 90, height: 664 }} />
          <i className="iso-zone iso-zone-green" style={{ left: 327, top: 657, width: 343, height: 103 }} />
          <i className="iso-zone iso-zone-green" style={{ left: 670, top: 56, width: 90, height: 40 }} />
          <i className="iso-plaza" />
          <i className="iso-lot" />
          <i className="iso-cloud" />
          {cityBlocks.map(block => <i key={block.id} className="iso-shadow" style={{ '--x': `${block.x + O}px`, '--y': `${block.y + O}px`, '--w': `${block.w}px`, '--d': `${block.d}px`, '--h': `${block.h}px` } as CSSProperties} />)}
          {fillers.map((f, i) => <i key={`f${i}`} className="iso-shadow" style={{ '--x': `${f.x}px`, '--y': `${f.y}px`, '--w': `${f.w}px`, '--d': `${f.d}px`, '--h': `${f.h}px` } as CSSProperties} />)}
        </div>
        <div className="iso-roads" aria-hidden="true">
          {allLines.map((l, i) => <i key={i} className={`iso-street${l.axis === 'v' ? ' iso-street-v' : ''}${SPUR_LINES.includes(l) ? ' iso-street-quiet' : ''}`} style={l.axis === 'h'
            ? { left: l.from - half, top: l.at - half, width: l.to - l.from + half * 2, height: half * 2 }
            : { left: l.at - half, top: l.from - half, width: half * 2, height: l.to - l.from + half * 2 }} />)}
          {junctions.map(j => <i key={`${j.x},${j.y}`} className={`iso-junction${j.n ? ' has-n' : ''}${j.s ? ' has-s' : ''}`} style={{ left: j.x - half, top: j.y - half, width: half * 2, height: half * 2 }} />)}
        </div>
        <div className="iso-props iso-outer" aria-hidden="true">
          <div className="iso-ring-commercial">{commercial.map((item, index) => <Sprite key={`c${index}`} item={item} index={index % 12} tone="c" still />)}</div>
          <div className="iso-ring-parks">{pocketParkProps.map((item, index) => <Sprite key={`p${index}`} item={item} index={index % 12} tone="p" still />)}</div>
          <i className="iso-k iso-twinkle" style={spriteStyle(townTree[0], townTree[1], townTree[2])}><i><b /><b /><b /><b /><b /></i></i>
          <div className="iso-ring-suburbs">{[...suburbsNear, ...suburbYards].map((item, index) => <Sprite key={`n${index}`} item={item} index={index % 12} tone="s" still />)}</div>
          {!small && <div className="iso-ring-far">{[...suburbsFar, ...woods].map((item, index) => <Sprite key={`f${index}`} item={item} index={index % 12} tone="f" still />)}</div>}
        </div>
        <div className="iso-props" aria-hidden="true">
          {[...industrial, ...nature, ...parked, ...holidayCore].map((item, index) => <Sprite key={index} item={item} index={index % 12} />)}
          
          {traffic.map((model, i) => <i key={`${model}-${i}`} ref={node => { carEls.current[i] = node; }} className="iso-k iso-traffic"><img src={spriteUrl(`${model}-0`)} alt="" decoding="async" /></i>)}
        </div>
        <div className="iso-fillers" aria-hidden="true">
          {fillers.map((f, i) => <i key={i} className="iso-box iso-filler" style={{ '--x': `${f.x}px`, '--y': `${f.y}px`, '--w': `${f.w}px`, '--d': `${f.d}px`, '--h': `${f.h}px`, '--c': f.c, '--i': (i % 9) + 2 } as CSSProperties}>
            <i className="iso-face iso-top" /><i className="iso-face iso-front" /><i className="iso-face iso-side" />
          </i>)}
        </div>
        <div className="iso-residents" aria-hidden="true" style={{ '--pw': `${personSize.w}px`, '--pax': `${personSize.ax}px`, '--pay': `${personSize.ay}px` } as CSSProperties}>
          {residents.map((w, i) => <i key={w.who + i} ref={node => { pedEls.current[i] = node; }} className="iso-ped is-walk" style={{ '--walk-dur': `${(0.67 * 12 / w.speed).toFixed(2)}s` } as CSSProperties}><i className="iso-ped-sprite" style={{ backgroundImage: `url(${personUrl(w.who, 'walk', 0)})` }} /></i>)}
          {standing.map(([who, x, y, dir], i) => <i key={`s${i}`} className="iso-ped is-idle" style={{ transform: `translate3d(${x + personSize.g}px, ${y + personSize.g}px, 0.6px)`, '--idle-delay': `${-i * 0.37}s` } as CSSProperties}><i className="iso-ped-sprite" style={{ backgroundImage: `url(${personUrl(who, 'idle', dir)})` }} /></i>)}
        </div>
        <nav className="iso-blocks" aria-label="City map of this page">
          {cityBlocks.map((block, index) => <a
            key={block.id}
            href={`#${block.target}`}
            className={`iso-box iso-${block.kind}`}
            style={{ '--x': `${block.x + O}px`, '--y': `${block.y + O}px`, '--w': `${block.w}px`, '--d': `${block.d}px`, '--h': `${block.h}px`, '--c': block.color, '--i': index } as CSSProperties}
            onClick={event => visit(event, block)}
          >
            <span className="iso-halo" aria-hidden="true" />
            <span className="iso-face iso-top" aria-hidden="true">
              {block.kind === 'tower' && <i className="iso-helipad">H</i>}
              {block.kind === 'lab' && <i className="iso-glassroof" />}
              {block.kind === 'house' && <><i className="iso-slope iso-slope-a" /><i className="iso-slope iso-slope-b" /></>}
              {block.kind === 'gallery' && <i className="iso-skylight" />}
            </span>
            <span className="iso-face iso-front" aria-hidden="true">
              {block.kind === 'tower' && <>{facades.slice(0, 3).map((src, i) => <img key={i} src={src} alt="" className="iso-billboard" style={{ '--n': i } as CSSProperties} loading="lazy" />)}<i className="iso-sheen" /></>}
              {block.kind === 'shop' && <><i className="iso-marquee" /><i className="iso-storefront" /><i className="iso-door iso-door-shop" /></>}
              {block.kind === 'arcade' && <><i className="iso-neon">PLAY</i><i className="iso-door iso-door-arcade" /><i className="iso-edge iso-edge-v" /><i className="iso-edge iso-edge-h" /></>}
              {block.kind === 'house' && <><i className="iso-door" /><i className="iso-window" /><i className="iso-window iso-window-2" /></>}
              {block.kind === 'lab' && <i className="iso-glass" />}
              {block.kind === 'antenna' && <i className="iso-sheen" />}
              {block.kind === 'gallery' && <i className="iso-print"><i /><i /></i>}
            </span>
            <span className="iso-face iso-side" aria-hidden="true">
              {block.kind === 'house' && <i className="iso-gable" />}
              {block.kind === 'arcade' && <i className="iso-edge iso-edge-h" />}
              {block.kind === 'tower' && <i className="iso-sheen" />}
              {block.kind === 'gallery' && <i className="iso-door iso-door-gallery" />}
            </span>
            {block.kind === 'tower' && <>{mini('iso-crown', 28, 28, 70, 70, 58, '#f0eee6')}{mini('iso-ac', 8, 100, 18, 16, 10, '#b9b7ad')}<i className="iso-spire" aria-hidden="true" /><i className="iso-roofsign" aria-hidden="true">js<b>*</b></i></>}
            {block.kind === 'shop' && <>{mini('iso-canopy', 16, 104, 108, 16, 4, '#4c5c2a')}{mini('iso-ac', 100, 14, 24, 20, 12, '#aebd6c')}<i className="iso-roofsign iso-roofsign-box" aria-hidden="true">PRICING</i></>}
            {block.kind === 'house' && <>{mini('iso-chimney', 70, 22, 14, 14, 44, '#2f5c4a')}<i className="iso-smoke" aria-hidden="true"><i /><i /><i /></i></>}
            {block.kind === 'lab' && <i className="iso-roofsign iso-roofsign-box iso-roofsign-lab" aria-hidden="true">LAB 04</i>}
            {block.kind === 'arcade' && <>{mini('iso-joystick', 36, 40, 28, 28, 10, '#44483f')}<i className="iso-ball" aria-hidden="true" /><i className="iso-roofsign iso-roofsign-arcade" aria-hidden="true">ARCADE</i></>}
            {block.kind === 'antenna' && <i className="iso-mast" aria-hidden="true"><i className="iso-dish" /><i className="iso-beacon" /><i className="iso-ring" /><i className="iso-ring" /><i className="iso-ring" /></i>}
            {block.kind === 'computer' && <>{mini('iso-keys', 26, 56, 80, 20, 4, '#bfc3b8')}<i className="iso-monitor" aria-hidden="true"><i className="iso-face iso-top" /><i className="iso-face iso-front"><i className="iso-term" /></i><i className="iso-face iso-side" /></i></>}
            {block.kind === 'gallery' && <i className="iso-roofsign iso-roofsign-box iso-roofsign-gallery" aria-hidden="true">PLAYGROUND</i>}
            <span className="iso-label"><b>{block.label}</b><small>{block.note}</small></span>
          </a>)}
        </nav>
      </div>
    </div>
    <p className="iso-caption"><span>CITY MAP / {String(cityBlocks.length).padStart(2, '0')} LANDMARKS / {residents.length + standing.length} RESIDENTS</span><span className="iso-caption-hover">Hover a building. Click to visit.</span><span className="iso-caption-touch">Tap a building to visit.</span></p>
  </div>;
}
