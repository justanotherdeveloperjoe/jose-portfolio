import { useEffect, useMemo, useRef, useState } from 'react';
import { composeScene, monterreyDay, sunTimeAt } from '../lib/monterreyScene.js';
import { forecastSeries, previewForecast, weatherAt } from '../lib/weather.js';
import { MonterreySky, revealLength } from './MonterreySky.jsx';
import './CompositionPlayground.css';

const modes = ['Motion', 'Layout', 'Type', 'Color'];
// Each palette is a pair of prints: by day, and by night once the real sun goes down over Monterrey.
const palettes = {
  Olive: {
    day: { sky: '#e1e5d1', horizon: '#ecedde', ink: '#283827', crest: '#536541', far: '#c5cdb2', mid: '#9ba887', near: '#5e6a50', sun: '#e9a35e' },
    night: { sky: '#1a2219', horizon: '#33392a', ink: '#e6ead6', crest: '#9fb383', far: '#222b20', mid: '#182017', near: '#10150f', moon: '#eeeed8', star: '#f1f0de' },
    glow: '#efb47a',
  },
  Terracotta: {
    day: { sky: '#efdfd0', horizon: '#f6e9dc', ink: '#542f28', crest: '#915139', far: '#e0c6b2', mid: '#c79d85', near: '#8b5b49', sun: '#db6f43' },
    night: { sky: '#241717', horizon: '#3d2a24', ink: '#f2e2d3', crest: '#d39a7d', far: '#2c1d1c', mid: '#211514', near: '#170e0e', moon: '#f6e8d9', star: '#f6e9da' },
    glow: '#f0976a',
  },
  Midnight: {
    day: { sky: '#203444', horizon: '#2c4555', ink: '#f0eadb', crest: '#c8d9ac', far: '#2b4655', mid: '#3a5a60', near: '#567570', sun: '#e8b46c' },
    night: { sky: '#0c1620', horizon: '#1d2c37', ink: '#ebe5d6', crest: '#b9cc9c', far: '#13202b', mid: '#0f1a23', near: '#0a1219', moon: '#eef0e0', star: '#eef1e2' },
    glow: '#e2a46a',
  },
};
const hints = {
  Motion: 'Drag the sun across the sky, or scrub through today in Monterrey.',
  Layout: 'Same place. A different way to frame it.',
  Type: 'Run your cursor across “Made in”. Each letter answers.',
  Color: 'Three palettes. A different feeling in each.',
};
const playLength = 9000; // Play a day: 24 hours in nine seconds.
const printedType = '.composition-location, .composition-title > *, .composition-note, .composition-colophon';
const hourMs = 3600000;
const clockLabel = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function CompositionPlayground() {
  const [mode, setMode] = useState('Motion');
  const [width, setWidth] = useState(100);
  const [weight, setWeight] = useState(500);
  const [tracking, setTracking] = useState(-4);
  const [palette, setPalette] = useState('Olive');
  const [pixels, setPixels] = useState(0);
  const [box, setBox] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [scrub, setScrub] = useState(null); // a moment someone is steering to; null while the poster follows the real clock
  const [playing, setPlaying] = useState(false);
  const [forecast, setForecast] = useState(null); // { series, preview } from MET Norway via /api/weather.php
  const [reveal, setReveal] = useState(null); // a new palette spreading in: the previous palette, where it starts and when
  const [waiting, setWaiting] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [reduced, setReduced] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const canvas = useRef(null);
  const print = useRef(null);
  const colophon = useRef(null);
  const tabs = useRef([]);
  const animations = useRef([]);
  const drag = useRef(null);
  const dayFrame = useRef(0);
  const format = pixels > 640 ? 'Wide' : pixels > 380 ? 'Compact' : 'Pocket';
  const date = scrub ?? now;
  const day = monterreyDay(date);
  const weather = useMemo(() => forecast && weatherAt(forecast.series, date), [forecast, date]);
  const scene = useMemo(() => box && composeScene({ date, ...box, palette: palettes[palette], live: !scrub, weather }), [date, box, palette, scrub, weather]);
  const previous = useMemo(() => reveal && box && composeScene({ date, ...box, palette: palettes[reveal.from], live: !scrub, weather }), [reveal, date, box, scrub, weather]);

  function stopMotion() {
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
  }
  function stopDay() {
    cancelAnimationFrame(dayFrame.current);
    dayFrame.current = 0;
    setPlaying(false);
  }
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setReduced(media.matches); if (media.matches) { stopMotion(); stopDay(); setWaiting(false); } };
    sync();
    media.addEventListener('change', sync);
    const measure = () => setBox({ width: print.current.clientWidth, height: print.current.clientHeight, horizon: colophon.current.offsetTop });
    const observer = new ResizeObserver(entries => {
      const resized = entries.find(entry => entry.target === canvas.current);
      if (resized) { setPixels(Math.round(resized.contentRect.width)); stopMotion(); }
      measure();
    });
    observer.observe(canvas.current);
    observer.observe(print.current);
    // The words and ridges arrive once, the first time the poster scrolls into view.
    const arrival = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { arrival.disconnect(); play(); } }, { threshold: 0.3 });
    arrival.observe(canvas.current);
    const clock = setInterval(() => setNow(new Date()), 30000);
    return () => { media.removeEventListener('change', sync); observer.disconnect(); arrival.disconnect(); clearInterval(clock); stopMotion(); cancelAnimationFrame(dayFrame.current); };
  }, []);
  useEffect(() => { stopMotion(); }, [mode, width, weight, tracking, palette]);

  // Monterrey's forecast, refreshed every quarter hour. In development ?weather=rain (clear, partlycloudy, cloudy, storm, fog) previews a condition.
  useEffect(() => {
    const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('weather');
    if (preview) { setForecast({ series: previewForecast(preview), preview: true }); return; }
    let active = true;
    const load = () => fetch('/api/weather.php').then(reply => reply.ok ? reply.json() : null).then(json => { const series = forecastSeries(json); if (active && series.length) setForecast({ series, preview: false }); }).catch(() => {});
    load();
    const refresh = setInterval(load, 15 * 60000);
    return () => { active = false; clearInterval(refresh); };
  }, []);

  // Letters near the pointer swell toward the font's heaviest weight, then settle back when it leaves.
  useEffect(() => {
    if (reduced) return;
    const surface = canvas.current, letters = [...surface.querySelectorAll('.composition-letter')], weights = letters.map(() => weight);
    let pointer = null, frame = 0, last = 0;
    // Easing by elapsed time (a 70ms time constant) settles the letters in under half a second at any frame rate.
    function tick(now) {
      const step = 1 - Math.exp(-Math.min(100, last ? now - last : 16) / 70);
      const rects = letters.map(letter => letter.getBoundingClientRect());
      let settling = false;
      letters.forEach((letter, i) => {
        const rect = rects[i], reach = rect.height * 2.4;
        const distance = pointer ? Math.hypot(pointer.x - rect.left - rect.width / 2, pointer.y - rect.top - rect.height / 2) : reach;
        const target = weight + (800 - weight) * Math.max(0, 1 - distance / reach) ** 2;
        weights[i] += (target - weights[i]) * step;
        if (Math.abs(target - weights[i]) < 0.5) weights[i] = target; else settling = true;
      });
      letters.forEach((letter, i) => { letter.style.fontWeight = pointer || settling ? Math.round(weights[i]) : ''; });
      last = now;
      frame = settling ? requestAnimationFrame(tick) : 0;
      if (!frame) last = 0;
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const move = event => { pointer = { x: event.clientX, y: event.clientY }; wake(); };
    const leave = () => { pointer = null; wake(); };
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerleave', leave);
    surface.addEventListener('pointercancel', leave);
    return () => {
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerleave', leave);
      surface.removeEventListener('pointercancel', leave);
      cancelAnimationFrame(frame);
      letters.forEach(letter => { letter.style.fontWeight = ''; });
    };
  }, [reduced, weight]);

  function play() {
    stopMotion();
    setWaiting(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animations.current = [...canvas.current.querySelectorAll('[data-entrance]')].map((element, index) => element.animate(
      [{ opacity: 0, transform: `translateY(${index === 2 ? 24 : 14}px)` }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 900, delay: index * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
    ));
  }
  function goLive() {
    stopDay(); setScrub(null); setNow(new Date());
    setAnnouncement('Back to live.');
  }
  function playDay() {
    if (playing) { stopDay(); setAnnouncement(`Paused at ${clockLabel(day.minutes)}.`); return; }
    const from = date.valueOf(), started = performance.now();
    setPlaying(true);
    setAnnouncement('Playing a day in Monterrey.');
    const tick = time => {
      const progress = Math.min(1, (time - started) / playLength);
      setScrub(new Date(from + progress * 24 * hourMs));
      if (progress < 1) dayFrame.current = requestAnimationFrame(tick);
      else { dayFrame.current = 0; setPlaying(false); setScrub(null); setNow(new Date()); setAnnouncement('A full day played. Back to live.'); }
    };
    dayFrame.current = requestAnimationFrame(tick);
  }
  function setMinutes(minutes) {
    stopDay();
    setScrub(new Date(day.start + Math.min(1439, Math.max(0, minutes)) * 60000));
  }
  // Dragging the sun keeps it under the pointer along its real path; dragging anywhere else moves twelve hours per poster width.
  function grab(event) {
    if (!scene || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const bounds = print.current.getBoundingClientRect(), x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    drag.current = { id: event.pointerId, x, start: date.valueOf(), onSun: Boolean(scene.sun && Math.hypot(x - scene.sun.x, y - scene.sun.y) < scene.sun.r * 2.6), moved: false };
  }
  function steer(event) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const x = event.clientX - print.current.getBoundingClientRect().left;
    if (!current.moved) {
      if (Math.abs(x - current.x) < 6) return;
      current.moved = true;
      stopDay();
      print.current.setPointerCapture(event.pointerId);
    }
    setScrub(current.onSun ? sunTimeAt(scene.azimuthAt(x), new Date(current.start)) : new Date(current.start + (x - current.x) / box.width * 12 * hourMs));
  }
  function release(event) {
    if (drag.current?.id !== event.pointerId) return;
    if (drag.current.moved) setAnnouncement(`Showing ${clockLabel(day.minutes)} in Monterrey.`);
    drag.current = null;
  }
  // The new palette spreads up into the print from the button that chose it.
  function choosePalette(name, event) {
    if (name === palette) return;
    const bounds = print.current.getBoundingClientRect(), button = event.currentTarget.getBoundingClientRect();
    const x = Math.min(bounds.width, Math.max(0, button.left + button.width / 2 - bounds.left));
    const reach = Math.hypot(Math.max(x, bounds.width - x), bounds.height) + 40;
    // Each block of type changes color as the ink front reaches it (the spread eases out: radius = reach × (1 − (1 − t)³)).
    for (const element of print.current.querySelectorAll(printedType)) {
      const box = element.getBoundingClientRect(), distance = Math.hypot(box.left + box.width / 2 - bounds.left - x, box.top + box.height / 2 - bounds.top - bounds.height);
      element.style.transitionDelay = `${Math.round((1 - Math.cbrt(Math.max(0, 1 - distance / reach))) * revealLength)}ms`;
    }
    setReveal({ from: palette, x, y: bounds.height, reach, start: performance.now() });
    setPalette(name);
  }
  useEffect(() => {
    if (!reveal) return;
    const done = setTimeout(() => setReveal(null), revealLength + 100);
    return () => { clearTimeout(done); print.current?.querySelectorAll(printedType).forEach(element => { element.style.transitionDelay = ''; }); };
  }, [reveal]);
  function reset() {
    stopMotion(); goLive(); setReveal(null); setWidth(100); setWeight(500); setTracking(-4); setPalette('Olive');
    setAnnouncement('Composition reset. Back to live.');
  }
  function navigateTabs(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % modes.length;
    else if (event.key === 'ArrowLeft') next = (index + modes.length - 1) % modes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = modes.length - 1;
    else return;
    event.preventDefault(); setMode(modes[next]); tabs.current[next]?.focus();
  }
  function stepTime(event) {
    const step = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15 }[event.key];
    if (!step) return;
    event.preventDefault();
    setMinutes(day.minutes + step * (event.shiftKey ? 4 : 1));
  }

  return <div className="composition-playground">
    <div className="composition-stage">
      <div ref={canvas} className="composition-canvas" data-waiting={waiting || undefined} role="img" aria-label={`Made in Monterrey. ${scene?.description ?? ''} ${palette} palette.`} style={{ width: `${width}%`, '--composition-paper': scene?.sky ?? palettes[palette].day.sky, '--composition-ink': scene?.ink ?? palettes[palette].day.ink, '--composition-weight': weight, '--composition-tracking': `${tracking / 100}em` }}>
        <div ref={print} className="composition-print" aria-hidden="true" onPointerDown={grab} onPointerMove={steer} onPointerUp={release} onPointerCancel={release}>
          <div className="composition-location"><span>Nuevo León / México</span><span>25.6866° N</span></div>
          <div className="composition-title"><span data-entrance>{[...'Made in'].map((letter, i) => <span key={i} className="composition-letter">{letter}</span>)}</span><em data-entrance>Monterrey.</em></div>
          <p className="composition-note">A view from home.<br />An idea in progress.</p>
          {scene && <MonterreySky scene={scene} {...box} previous={previous} reveal={reveal} reduced={reduced} />}
          <div ref={colophon} className="composition-colophon"><span>Hecho con curiosidad.</span><span className="composition-readout">{scene?.readout}</span></div>
        </div>
      </div>
    </div>
    <div className="composition-toolbar">
      <div className="composition-tabs" role="tablist" aria-label="Explore the composition">
        {modes.map((name, index) => <button key={name} ref={el => { tabs.current[index] = el; }} id={`composition-tab-${name.toLowerCase()}`} type="button" role="tab" aria-selected={mode === name} aria-controls="composition-controls" tabIndex={mode === name ? 0 : -1} onClick={() => setMode(name)} onKeyDown={event => navigateTabs(event, index)}><span aria-hidden="true">0{index + 1}</span>{name}</button>)}
      </div>
      <button type="button" className="composition-reset" onClick={reset}>Reset <span aria-hidden="true">↺</span></button>
    </div>
    <div className="composition-controls" id="composition-controls" role="tabpanel" aria-labelledby={`composition-tab-${mode.toLowerCase()}`} tabIndex={0}>
      <div className="composition-control-intro"><span>{mode === 'Layout' ? `${format} / ${pixels}px` : mode === 'Motion' ? `Time study / ${scrub ? 'replay' : 'live'}` : `${mode} study`}</span><p>{reduced && mode === 'Motion' ? 'Reduced motion is on. Drag the sun or scrub the day by hand.' : hints[mode]}</p></div>
      <div className="composition-inputs">
        {mode === 'Motion' && <>
          <label className="composition-range composition-time" htmlFor="composition-time">Time of day <output>{clockLabel(day.minutes)}</output><input id="composition-time" type="range" min="0" max="1439" value={day.minutes} aria-valuetext={`${clockLabel(day.minutes)} in Monterrey`} onChange={event => setMinutes(Number(event.target.value))} onKeyDown={stepTime} /><span className="composition-time-scale" aria-hidden="true"><span>00:00</span><span>12:00</span><span>24:00</span></span></label>
          <button type="button" className="composition-play" disabled={reduced} onClick={playDay}>{playing ? 'Pause' : 'Play a day'} <span aria-hidden="true">{playing ? 'Ⅱ' : '↗'}</span></button>
          {scrub && <button type="button" className="composition-live" onClick={goLive}>Live <span aria-hidden="true">↺</span></button>}
        </>}
        {mode === 'Layout' && <label className="composition-range" htmlFor="composition-width">Canvas width <output>{width}%</output><input id="composition-width" type="range" min="25" max="100" value={width} onChange={event => setWidth(Number(event.target.value))} /></label>}
        {mode === 'Type' && <><label className="composition-range" htmlFor="composition-weight">Weight <output>{weight}</output><input id="composition-weight" type="range" min="300" max="700" step="100" value={weight} onChange={event => setWeight(Number(event.target.value))} /></label><label className="composition-range" htmlFor="composition-tracking">Letter spacing <output>{tracking / 100} em</output><input id="composition-tracking" type="range" min="-5" max="2" value={tracking} onChange={event => setTracking(Number(event.target.value))} /></label></>}
        {mode === 'Color' && <div className="composition-palettes" role="group" aria-label="Color palette">{Object.entries(palettes).map(([name, colors]) => <button key={name} type="button" aria-pressed={palette === name} onClick={event => choosePalette(name, event)}><i aria-hidden="true" style={{ background: colors.day.sky, borderColor: colors.day.ink }} />{name}</button>)}</div>}
      </div>
    </div>
    {/* The story folds away; the data credits stay visible, as MET Norway's license and the elevation sources ask. */}
    <div className="composition-about">
      <details className="composition-credits"><summary>About this living print <span aria-hidden="true">+</span></summary><p>Live for 25.6866° N, 100.3161° W: the sun and moon are where they are over Monterrey right now, the skyline is computed from elevation data, and the clouds, rain and fog follow the forecast.</p></details>
      <p className="composition-sources">{forecast && !forecast.preview && <>Weather data from <a href="https://api.met.no/" target="_blank" rel="noreferrer">MET Norway</a> · </>}Terrain: INEGI Continental relief 2016, USGS SRTM</p>
    </div>
    <span className="composition-announcement" role="status">{announcement}</span>
  </div>;
}
