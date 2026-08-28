import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion.js';

const WORDS = [
  'RESTAURANTS',
  'GYMS',
  'FACTORIES',
  'CREATORS',
  'STORES',
  'REAL ESTATE',
  'LOGISTICS',
  'HEALTH',
];

function alreadyShown() {
  try {
    return sessionStorage.getItem('jvs_intro_shown') === '1';
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem('jvs_intro_shown', '1');
  } catch {
    /* ignore */
  }
}

const T_MARK = 1100;
const T_BUILD = WORDS.length * 260 + 300;
const T_STATEMENT = 1800;

export function IntroSequence({ onDone }) {
  const skip = prefersReducedMotion() || alreadyShown();
  const [phase, setPhase] = useState(skip ? 5 : 0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (skip) {
      markShown();
      onDone();
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    const timers = [];
    timers.push(setTimeout(() => setPhase(1), T_MARK));
    timers.push(setTimeout(() => setPhase(2), T_MARK + T_BUILD));
    timers.push(setTimeout(() => setPhase(3), T_MARK + T_BUILD + T_STATEMENT));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 1) return undefined;
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1 < WORDS.length ? i + 1 : i));
    }, 260);
    return () => clearInterval(id);
  }, [phase]);

  function handleEnter() {
    document.body.style.overflow = '';
    markShown();
    setPhase(5);
    onDone();
  }

  if (phase >= 5) return null;

  return (
    <div
      className={`intro phase-${phase}`}
      onClick={phase === 3 ? handleEnter : undefined}
      role="presentation"
    >
      <div className="intro-inner">
        {phase === 0 && (
          <div className="intro-mark">
            <span>JOSE SANCHEZ</span>
            <span>FRONT-END DEVELOPER</span>
          </div>
        )}
        {phase === 1 && (
          <div className="intro-build">
            <span className="intro-build-label">I BUILD</span>
            <span className="intro-word">{WORDS[wordIndex]}</span>
          </div>
        )}
        {phase === 2 && (
          <div className="intro-statement">
            <span>DIFFERENT BUSINESSES.</span>
            <span>DIFFERENT WORLDS.</span>
          </div>
        )}
        {phase === 3 && (
          <div className="intro-p00">
            <span className="intro-p00-num">00 / 09</span>
            <span className="intro-p00-title">THIS WEBSITE</span>
            <span className="intro-p00-tags">DESIGN · DEVELOPMENT · MOTION · EXPERIMENTATION</span>
            <span className="intro-p00-name">Jose Sanchez</span>
            <span className="intro-p00-rules">No client. No brief. No rules.</span>
            <button type="button" className="intro-enter" onClick={handleEnter}>
              ENTER <span aria-hidden="true">↓</span>
            </button>
          </div>
        )}
      </div>
      {phase !== 3 && (
        <span className="intro-skip" onClick={handleEnter} role="button" tabIndex={0}>
          SKIP ↷
        </span>
      )}
    </div>
  );
}
