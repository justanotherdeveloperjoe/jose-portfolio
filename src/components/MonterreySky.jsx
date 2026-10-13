import { useEffect, useId, useRef, useState } from 'react';
import { ridgeColumns } from '../lib/monterreyScene.js';
import { createPrint, lightning } from '../lib/printShader.js';

export const revealLength = 1100; // how long a new palette takes to spread across the print

// The poster's background: a risograph print drawn by WebGL2, or the same scene as SVG where WebGL2 isn't available.
export function MonterreySky(props) {
  const [printable, setPrintable] = useState(true);
  return printable ? <PrintCanvas {...props} onUnavailable={() => setPrintable(false)} /> : <SkySvg {...props} />;
}

// Draws on demand; keeps animating only while stars twinkle, weather moves or a new palette spreads, the poster is on screen, and motion is allowed.
function PrintCanvas({ scene, width, height, horizon, previous, reveal, reduced, onUnavailable }) {
  const canvas = useRef(null), print = useRef(null), latest = useRef(null), kick = useRef(() => {});
  latest.current = { scene, previous, reveal, reduced };

  useEffect(() => {
    const element = canvas.current, renderer = createPrint(element);
    if (!renderer) { onUnavailable(); return; }
    print.current = renderer;
    let frame = 0, onScreen = true;
    const started = performance.now();
    function render(now) {
      frame = 0;
      const { scene, previous, reveal, reduced } = latest.current;
      let spread = null;
      if (reveal && previous && !reduced) {
        const progress = Math.min(1, (now - reveal.start) / revealLength);
        if (progress < 1) spread = { x: reveal.x, y: reveal.y, radius: (1 - (1 - progress) ** 3) * reveal.reach };
      }
      const time = reduced ? 0 : (now - started) / 1000, weather = scene.weather;
      renderer.draw(scene, { time, previous: spread && previous, reveal: spread, flash: weather?.storm && !reduced ? lightning(time) : 0 });
      // A nearly clear sky (a few wisps) holds still rather than keep the GPU busy.
      const moving = scene.starLight > 0.01 || spread || (weather && (weather.cover > 0.1 || weather.rain > 0 || weather.storm));
      if (onScreen && !reduced && moving) frame = requestAnimationFrame(render);
    }
    kick.current = () => { if (!frame) frame = requestAnimationFrame(render); };
    const watcher = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; if (onScreen) kick.current(); });
    watcher.observe(element);
    const lost = event => { event.preventDefault(); onUnavailable(); };
    element.addEventListener('webglcontextlost', lost);
    return () => { cancelAnimationFrame(frame); watcher.disconnect(); element.removeEventListener('webglcontextlost', lost); kick.current = () => {}; print.current = null; };
  }, []);

  useEffect(() => {
    print.current?.resize(width, height, horizon, ridgeColumns(width, height, horizon), Math.min(2, window.devicePixelRatio || 1));
    kick.current();
  }, [width, height, horizon]);
  useEffect(() => { kick.current(); }, [scene, previous, reveal, reduced]);

  return <canvas ref={canvas} className="composition-sky" data-entrance aria-hidden="true" />;
}

// The same scene as SVG: sky, glow, stars, moon, sun, then the real ridges.
function SkySvg({ scene, width, height, horizon }) {
  const id = useId().replace(/:/g, '');
  const { sun, moon, glow } = scene;
  return <svg className="composition-sky" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2={horizon} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={scene.sky} /><stop offset="1" stopColor={scene.horizon} /></linearGradient>
      <radialGradient id={`${id}-glow`}><stop offset="0" stopColor={glow.color} stopOpacity={glow.strength} /><stop offset="1" stopColor={glow.color} stopOpacity="0" /></radialGradient>
      {sun && <radialGradient id={`${id}-halo`}><stop offset=".3" stopColor={sun.color} stopOpacity={sun.halo} /><stop offset="1" stopColor={sun.color} stopOpacity="0" /></radialGradient>}
      <clipPath id={`${id}-above`}><rect width={width} height={horizon} /></clipPath>
    </defs>
    <rect width={width} height={height} fill={`url(#${id}-sky)`} />
    {glow.strength > 0 && <ellipse cx={glow.x} cy={horizon} rx={width * 0.6} ry={horizon * 0.85} fill={`url(#${id}-glow)`} />}
    <g clipPath={`url(#${id}-above)`}>
      <g fill={scene.starColor}>{scene.stars.map((star, i) => <circle key={i} cx={star.x.toFixed(1)} cy={star.y.toFixed(1)} r={star.size} opacity={star.opacity.toFixed(2)} />)}</g>
      {moon && <g className="composition-moon" transform={`translate(${moon.x.toFixed(1)} ${moon.y.toFixed(1)}) rotate(${moon.tilt.toFixed(1)})`} opacity={moon.opacity}><circle r={moon.r} fill={moon.shade} /><path d={moon.lit} fill={moon.color} /></g>}
      {sun && <g className="composition-sun"><circle cx={sun.x} cy={sun.y} r={sun.r * 3.2} fill={`url(#${id}-halo)`} /><circle cx={sun.x} cy={sun.y} r={sun.r} fill={sun.color} /></g>}
    </g>
    <g className="composition-ridges" data-entrance>
      {scene.ridges.map(ridge => <path key={ridge.band} d={ridge.fill} fill={ridge.color} />)}
      <path d={scene.ridges[1].crest} fill="none" stroke={scene.crest} strokeWidth="1.25" strokeLinejoin="round" />
    </g>
  </svg>;
}
