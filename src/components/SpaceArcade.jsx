import { useEffect, useRef, useState } from 'react';
import { createGame, drawGame, GAME_WIDTH, GAME_HEIGHT, SPRITES, stepGame } from './spaceGame.js';
import './SpaceArcade.css';

function PixelVisitor() {
  return <svg viewBox="0 0 9 7" className="arcade-mascot" aria-hidden="true" shapeRendering="crispEdges">{SPRITES.visitor.flatMap((row, y) => [...row].map((pixel, x) => pixel === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null))}</svg>;
}

export function SpaceArcade({ openRequest = 0 }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('ready');
  const [hud, setHud] = useState({ score: 0, lives: 3, wave: 1 });
  const [best, setBest] = useState(0);
  const [supported, setSupported] = useState(true);
  const screen = useRef(null);
  const launch = useRef(null);
  const frame = useRef(null);
  const game = useRef(createGame());
  const input = useRef({ left: false, right: false, fire: false });
  const touch = useRef(new Map());
  const keys = useRef(new Set());
  const reduced = useRef(false);
  const fireQueued = useRef(false);
  const handledRequest = useRef(0);
  const clearInput = () => { keys.current.clear(); touch.current.clear(); fireQueued.current = false; input.current = { left: false, right: false, fire: false }; };
  useEffect(() => {
    if (!openRequest || handledRequest.current === openRequest) return;
    setOpen(true);
    clearInput();
    setPhase(value => value === 'playing' ? 'paused' : value);
  }, [openRequest]);
  useEffect(() => {
    if (!open || !openRequest || handledRequest.current === openRequest) return;
    const raf = requestAnimationFrame(() => {
      handledRequest.current = openRequest;
      frame.current?.scrollIntoView({ behavior: reduced.current ? 'instant' : 'smooth', block: 'center' });
      frame.current?.querySelector('.arcade-start')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, openRequest]);
  function syncInput() {
    const actions = [...touch.current.values()];
    input.current = {
      left: keys.current.has('ArrowLeft') || keys.current.has('KeyA') || actions.includes('left'),
      right: keys.current.has('ArrowRight') || keys.current.has('KeyD') || actions.includes('right'),
      fire: keys.current.has('Space') || actions.includes('fire'),
    };
  }
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reduced.current = media.matches; };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const context = screen.current.getContext('2d');
    if (!context) { setSupported(false); return; }
    context.imageSmoothingEnabled = false;
    drawGame(context, game.current, reduced.current);
    if (phase !== 'playing') return;
    let previous = performance.now();
    let raf;
    let lastHud = `${game.current.score}/${game.current.lives}/${game.current.wave}`;
    function tick(now) {
      stepGame(game.current, { ...input.current, fire: input.current.fire || fireQueued.current }, (now - previous) / 1000);
      fireQueued.current = false;
      previous = now;
      drawGame(context, game.current, reduced.current);
      const nextHud = `${game.current.score}/${game.current.lives}/${game.current.wave}`;
      if (nextHud !== lastHud) {
        lastHud = nextHud;
        setHud({ score: game.current.score, lives: game.current.lives, wave: game.current.wave });
        setBest(value => Math.max(value, game.current.score));
      }
      if (game.current.state === 'over') { clearInput(); setPhase('over'); return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, phase]);

  useEffect(() => {
    if (!open) return;
    const pause = () => { clearInput(); setPhase(value => value === 'playing' ? 'paused' : value); };
    const visibility = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); }, { threshold: .15 });
    observer.observe(frame.current);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', pause);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', pause); clearInput(); };
  }, [open]);

  function start() {
    game.current = createGame(); clearInput();
    setHud({ score: 0, lives: 3, wave: 1 }); setPhase('playing');
    screen.current.focus({ preventScroll: true });
  }
  function openArcade() {
    game.current = createGame(); clearInput();
    setHud({ score: 0, lives: 3, wave: 1 }); setPhase('ready'); setOpen(true);
  }
  function resume() { clearInput(); setPhase('playing'); screen.current.focus({ preventScroll: true }); }
  function togglePause() {
    if (phase === 'playing') { clearInput(); setPhase('paused'); }
    else if (phase === 'paused') resume();
  }
  function close() { clearInput(); setPhase('ready'); setOpen(false); launch.current.focus({ preventScroll: true }); }
  function keyboard(event, pressed) {
    if (event.target !== screen.current) return;
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(event.code)) {
      event.preventDefault();
      if (pressed) keys.current.add(event.code); else keys.current.delete(event.code);
      if (pressed && event.code === 'Space' && phase === 'playing') fireQueued.current = true;
      syncInput();
    } else if (pressed && !event.repeat && (event.code === 'KeyP' || event.code === 'Escape')) {
      event.preventDefault(); togglePause();
    }
  }
  function touchStart(event, action) {
    if (phase !== 'playing') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touch.current.set(event.pointerId, action); syncInput();
    if (action === 'fire') fireQueued.current = true;
  }
  function touchEnd(event) { touch.current.delete(event.pointerId); syncInput(); }
  function touchKeyboard(event, action, pressed) {
    if (!['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();
    const id = `keyboard-${action}`;
    if (pressed && phase === 'playing') touch.current.set(id, action); else touch.current.delete(id);
    if (pressed && phase === 'playing' && action === 'fire') fireQueued.current = true;
    syncInput();
  }
  return <section id="arcade" className={`space-arcade ${open ? 'is-open' : ''}`} aria-labelledby="arcade-title">
    <div className="arcade-invitation"><PixelVisitor /><div><span className="arcade-kicker">Off hours / A tiny arcade</span><h3 id="arcade-title">A little space to play.</h3><p>Clear a wave. Catch your breath. Back to building.</p></div><button ref={launch} type="button" className="arcade-launch" aria-expanded={open} aria-controls="space-arcade-panel" onClick={() => open ? close() : openArcade()}>{open ? 'Close arcade' : 'Take a little break'} <span aria-hidden="true">{open ? '−' : '↗'}</span></button></div>
    <div className="arcade-reveal" id="space-arcade-panel" aria-hidden={!open} inert={!open ? '' : undefined}>
      <div className="arcade-reveal-inner"><div className="arcade-panel" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { clearInput(); setPhase(value => value === 'playing' ? 'paused' : value); } }}>
        <div className="arcade-hud"><div><span>Score <b>{String(hud.score).padStart(4, '0')}</b></span><span>Wave <b>{String(hud.wave).padStart(2, '0')}</b></span><span>Lives <b>{hud.lives}</b></span><span className="arcade-best">Best <b>{String(best).padStart(4, '0')}</b></span></div><button type="button" onClick={togglePause} disabled={!['playing', 'paused'].includes(phase)}>{phase === 'paused' ? 'Resume' : 'Pause'}</button></div>
        <div className="arcade-screen" ref={frame}>
          <canvas ref={screen} width={GAME_WIDTH} height={GAME_HEIGHT} tabIndex={open ? 0 : -1} aria-label="Space arcade playfield" aria-describedby="arcade-controls" onKeyDown={event => keyboard(event, true)} onKeyUp={event => keyboard(event, false)}>
            A space arcade with 21 pixel visitors per wave. Use the left and right arrows to move, Space to fire, and P to pause.
          </canvas>
          {phase !== 'playing' && <div className="arcade-overlay"><PixelVisitor /><span className="arcade-kicker">{phase === 'over' ? 'A good little break.' : phase === 'paused' ? 'Take your time.' : 'One ship. A little curiosity.'}</span><h4>{!supported ? 'This browser needs a newer canvas.' : phase === 'over' ? 'Another round?' : phase === 'paused' ? 'On a little pause.' : 'Make some space.'}</h4><p>{phase === 'over' ? `${hud.score} points · Wave ${hud.wave}` : phase === 'paused' ? 'Your place is saved for this round.' : 'Move, dodge, and clear the sky.'}</p>{supported && <button type="button" className="arcade-start" onClick={phase === 'paused' ? resume : start}>{phase === 'paused' ? 'Keep playing' : phase === 'over' ? 'Play again' : 'Start a round'} <span aria-hidden="true">↗</span></button>}</div>}
        </div>
        <div className="arcade-bottom"><p id="arcade-controls"><kbd>←</kbd> <kbd>→</kbd> or A / D to move <span>·</span> <kbd>Space</kbd> to fire <span>·</span> P / Esc to pause</p><span>Original pixels. A familiar little challenge.</span></div>
        <div className="arcade-touch" role="group" aria-label="Arcade touch controls">{[['left', '←', 'Move left'], ['right', '→', 'Move right'], ['fire', 'Fire ↗', 'Fire']].map(([action, label, name]) => <button key={action} type="button" aria-label={name} disabled={phase !== 'playing'} onPointerDown={event => touchStart(event, action)} onPointerUp={touchEnd} onPointerCancel={touchEnd} onLostPointerCapture={touchEnd} onKeyDown={event => touchKeyboard(event, action, true)} onKeyUp={event => touchKeyboard(event, action, false)} onBlur={() => { touch.current.delete(`keyboard-${action}`); syncInput(); }}>{label}</button>)}</div>
        <p className="arcade-status" role="status">{phase === 'over' ? `Round over. ${hud.score} points.` : phase === 'paused' ? 'Game paused.' : phase === 'playing' ? `Wave ${hud.wave}. ${hud.lives} lives remaining.` : 'Ready when you are.'}</p>
        {openRequest > 0 && <a className="arcade-sandbox-return" href="#sandbox" onClick={() => document.querySelector('#sandbox-command')?.focus({ preventScroll: true })}>Back to the sandbox ↘</a>}
      </div></div>
    </div>
  </section>;
}
