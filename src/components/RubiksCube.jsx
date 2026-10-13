import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createSolvedCubies, randomMove, invertMove, applyMove, applyMoves, faces, plastic, turnCss } from '../lib/rubiksCube.js';
import './RubiksCube.css';

const SCRAMBLE_MOVES = 14;
const TURN_MS = 220;       // one quarter-turn while scrambling
const GAP_MS = 90;         // the breath between one turn and the next
const SOLVE_TURN_MS = 160; // solving plays a touch faster, for a satisfying "fast solve"
const SOLVE_GAP_MS = 60;
const PAUSE_MS = 550;      // the beat between "scrambled" and "starts solving"
const EASING = 'cubic-bezier(.65, .05, .36, 1)';
const rotate = { x: 'rotateX', y: 'rotateY', z: 'rotateZ' };
const axisIndex = { x: 0, y: 1, z: 2 };

// A small Rubik's cube that scrambles itself when clicked, then un-scrambles itself back to solved.
// There's no "solver": it remembers the random moves it scrambled with, then plays them backwards.
export function RubiksCube() {
  const [cubies, setCubies] = useState(createSolvedCubies);
  const [turning, setTurning] = useState(null); // the one move animating right now: { axis, layer, dir, turnMs, done }
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const layer = useRef(null);
  const timers = useRef([]); // every timer started, so all of them stop if the page goes away mid-spin
  const later = (callback, ms) => timers.current.push(setTimeout(callback, ms));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Spins the turning slice with the Web Animations API (the same way the rest of the site animates).
  // The animation finishing is what commits that turn — that turn, and only that turn.
  useLayoutEffect(() => {
    if (!turning) return undefined;
    const fn = rotate[turning.axis];
    const animation = layer.current.animate(
      [{ transform: `${fn}(0deg)` }, { transform: `${fn}(${turning.dir * 90}deg)` }],
      { duration: turning.turnMs, easing: EASING, fill: 'forwards' },
    );
    animation.finished.then(turning.done, () => {}); // a cancelled animation (page left) just stops
    return () => animation.cancel();
  }, [turning]);

  // Plays a list of moves one after another, each fully animated, then calls onFinished.
  function play(moves, turnMs, gapMs, onFinished, index = 0) {
    if (index >= moves.length) { onFinished(); return; }
    const move = moves[index];
    let finished = false;
    const done = () => {
      if (finished) return; // the animation and this turn's backup timer can both call this; only the first counts
      finished = true;
      setCubies(current => applyMove(current, move));
      setTurning(null);
      later(() => play(moves, turnMs, gapMs, onFinished, index + 1), gapMs);
    };
    setTurning({ ...move, turnMs, done });
    // A backup for THIS turn only, in case the browser never reports the animation as finished
    // (a background tab, say). It can never touch the next turn, because it calls this turn's own done().
    later(done, turnMs + 250);
  }

  function shuffle() {
    if (busy) return; // still busy: ignore the click (the button stays focusable, so keyboard focus isn't lost)
    const moves = Array.from({ length: SCRAMBLE_MOVES }, randomMove);
    const undo = [...moves].reverse().map(invertMove);
    setBusy(true);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No spinning: show it scrambled for a moment, then solved again.
      setCubies(current => applyMoves(current, moves));
      setAnnouncement('Shuffled.');
      later(() => { setCubies(current => applyMoves(current, undo)); setAnnouncement('Solved.'); setBusy(false); }, 700);
      return;
    }

    setAnnouncement('Shuffling the cube…');
    play(moves, TURN_MS, GAP_MS, () => {
      setAnnouncement('Working it out…');
      later(() => play(undo, SOLVE_TURN_MS, SOLVE_GAP_MS, () => { setAnnouncement('Solved.'); setBusy(false); }), PAUSE_MS);
    });
  }

  const inSlice = cubie => Boolean(turning) && cubie.pos[axisIndex[turning.axis]] === turning.layer;

  function renderCubie(cubie) {
    const [x, y, z] = cubie.pos;
    return <div key={cubie.id} className="rubiks-cubie" style={{ transform: `translate3d(calc(var(--rubiks-step) * ${x}), calc(var(--rubiks-step) * ${y}), calc(var(--rubiks-step) * ${z})) ${turnCss(cubie.turn)}` }}>
      {faces.map(face => <div key={face.key} className="rubiks-face" style={{ transform: `${face.css} translateZ(var(--rubiks-half))`, background: cubie.faceColors[face.key] || plastic }} />)}
    </div>;
  }

  return <div className="rubiks-wrap">
    <button type="button" className="rubiks-trigger" onClick={shuffle} aria-disabled={busy} aria-label="A little Rubik's cube. Click it to shuffle — it'll work itself back to solved on its own.">
      <div className="rubiks-scene">
        <div className="rubiks-cubies">
          {cubies.filter(cubie => !inSlice(cubie)).map(renderCubie)}
          {turning && <div ref={layer} className="rubiks-turn-layer">{cubies.filter(inSlice).map(renderCubie)}</div>}
        </div>
      </div>
    </button>
    <span className="rubiks-announcement" role="status">{announcement}</span>
  </div>;
}
