import { useEffect, useRef, useState } from 'react';
import { createSolvedCubies, randomMove, invertMove, applyMove, applyMoves, plastic } from '../lib/rubiksCube.js';
import './RubiksCube.css';

const SCRAMBLE_MOVES = 14;
const TURN_MS = 220;       // how long one quarter-turn takes to animate
const GAP_MS = 90;         // the little pause between one turn finishing and the next starting
const SOLVE_TURN_MS = 160; // solving plays a touch faster than scrambling, for a satisfying "fast solve"
const SOLVE_GAP_MS = 60;
const PAUSE_MS = 550;      // the beat between "done scrambling" and "starts solving"

// Which way each of a small cube's 6 faces points, before any turning.
const faceOrder = [
  { key: 'right', base: 'rotateY(90deg)' }, { key: 'left', base: 'rotateY(-90deg)' },
  { key: 'up', base: 'rotateX(90deg)' }, { key: 'down', base: 'rotateX(-90deg)' },
  { key: 'front', base: '' }, { key: 'back', base: 'rotateY(180deg)' },
];

// A small Rubik's cube that scrambles itself when clicked, then un-scrambles itself back to solved.
// There's no "solver": it just remembers the random moves it scrambled with, then plays them backwards.
export function RubiksCube() {
  const [cubies, setCubies] = useState(createSolvedCubies);
  const [turning, setTurning] = useState(null); // the one move currently animating, or null when still
  const [status, setStatus] = useState('idle'); // 'idle' | 'scrambling' | 'solving'
  const [announcement, setAnnouncement] = useState('');
  const timers = useRef([]);     // every timer we start, so they can all be cancelled if the page leaves mid-spin
  const settleMove = useRef(null); // "finish the move that's animating right now" — set fresh before each turn

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Plays one move in a list, animated, then calls itself again for the next one until the list runs out.
  function playAnimated(queue, index, turnMs, gapMs, onFinished) {
    if (index >= queue.length) { onFinished(); return; }
    const move = queue[index];
    let settled = false;
    // The real end of the CSS turn calls this. So does a backup timer, in case the tab was in the
    // background and the browser skipped the animation — either way this only ever runs once per move.
    settleMove.current = () => {
      if (settled) return;
      settled = true;
      setCubies(current => applyMove(current, move));
      setTurning(null);
      timers.current.push(setTimeout(() => playAnimated(queue, index + 1, turnMs, gapMs, onFinished), gapMs));
    };
    setTurning({ ...move, angle: 0, turnMs });
    // Waiting two frames before setting the real angle is what makes it animate: the browser needs to
    // actually paint "0deg" once before "90deg" arrives, or it just jumps straight there with no motion.
    requestAnimationFrame(() => requestAnimationFrame(() => setTurning(current => current && { ...current, angle: move.dir * 90 })));
    timers.current.push(setTimeout(() => settleMove.current?.(), turnMs + 120));
  }

  function shuffle() {
    if (status !== 'idle') return;
    const moves = Array.from({ length: SCRAMBLE_MOVES }, randomMove);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No continuous turning — just show "scrambled", pause, then show "solved" again.
      setStatus('scrambling');
      setAnnouncement('Shuffled.');
      setCubies(current => applyMoves(current, moves));
      timers.current.push(setTimeout(() => {
        setCubies(current => applyMoves(current, [...moves].reverse().map(invertMove)));
        setAnnouncement('Solved.');
        setStatus('idle');
      }, 700));
      return;
    }

    setStatus('scrambling');
    setAnnouncement('Shuffling the cube…');
    playAnimated(moves, 0, TURN_MS, GAP_MS, () => {
      setAnnouncement('Working it out…');
      timers.current.push(setTimeout(() => {
        setStatus('solving');
        playAnimated([...moves].reverse().map(invertMove), 0, SOLVE_TURN_MS, SOLVE_GAP_MS, () => {
          setAnnouncement('Solved.');
          setStatus('idle');
        });
      }, PAUSE_MS));
    });
  }

  const axisOf = { x: 0, y: 1, z: 2 };
  const turningIds = turning && new Set(cubies.filter(c => c.pos[axisOf[turning.axis]] === turning.layer).map(c => c.id));
  const wrapperTransform = turning && `${{ x: 'rotateX', y: 'rotateY', z: 'rotateZ' }[turning.axis]}(${turning.angle}deg)`;

  function renderCubie(cubie) {
    return <div key={cubie.id} className="rubiks-cubie" style={{ transform: `translate3d(calc(var(--rubiks-step) * ${cubie.pos[0]}), calc(var(--rubiks-step) * ${-cubie.pos[1]}), calc(var(--rubiks-step) * ${cubie.pos[2]})) ${cubie.orientation}` }}>
      {faceOrder.map(({ key, base }) => <div key={key} className="rubiks-face" style={{ transform: `${base} translateZ(var(--rubiks-half))`, background: cubie.faceColors[key] || plastic }} />)}
    </div>;
  }

  const stillCubies = turningIds ? cubies.filter(c => !turningIds.has(c.id)) : cubies;
  const movingCubies = turningIds ? cubies.filter(c => turningIds.has(c.id)) : [];

  return <div className="rubiks-wrap">
    <button type="button" className="rubiks-trigger" onClick={shuffle} disabled={status !== 'idle'} aria-label="A little Rubik's cube. Click it to shuffle — it'll work itself back to solved on its own.">
      <div className="rubiks-scene">
        <div className="rubiks-cubies">
          {stillCubies.map(renderCubie)}
          {turning && <div className="rubiks-turn-layer" style={{ transform: wrapperTransform, '--rubiks-turn-duration': `${turning.turnMs}ms` }} onTransitionEnd={() => settleMove.current?.()}>{movingCubies.map(renderCubie)}</div>}
        </div>
      </div>
    </button>
    <span className="rubiks-announcement" role="status">{announcement}</span>
  </div>;
}
