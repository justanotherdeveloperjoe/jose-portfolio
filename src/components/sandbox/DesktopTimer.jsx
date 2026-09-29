import { useEffect, useRef, useState } from 'react';
import { timerElapsed } from './utilityMath.js';

const initial = { mode: 'countdown', duration: 25 * 60000, elapsed: 0, running: false, startedAt: 0, completed: false };

export function DesktopTimer({ desktopActive, onNotify }) {
  const [timer, setTimer] = useState(initial), [now, setNow] = useState(Date.now), [sound, setSound] = useState(false), [visible, setVisible] = useState(() => !document.hidden);
  const audio = useRef(null), soundRef = useRef(sound);
  soundRef.current = sound;
  useEffect(() => {
    const update = () => { setVisible(!document.hidden); setNow(Date.now()); };
    document.addEventListener('visibilitychange', update);
    return () => { document.removeEventListener('visibilitychange', update); audio.current?.close().catch(() => {}); };
  }, []);
  useEffect(() => {
    if (!desktopActive) setTimer(previous => previous.running ? { ...previous, elapsed: timerElapsed(previous, Date.now()), running: false } : previous);
  }, [desktopActive]);
  useEffect(() => {
    if (!timer.running || !desktopActive) return;
    let interval, timeout;
    function complete() {
      setNow(Date.now());
      setTimer(previous => ({ ...previous, elapsed: previous.duration, running: false, completed: true }));
      onNotify('Focus session complete. Time for a little break.');
      const context = audio.current;
      if (soundRef.current && context?.state === 'running') {
        const tone = context.createOscillator(), gain = context.createGain();
        tone.type = 'sine'; tone.frequency.value = 660;
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(.08, context.currentTime + .02);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .5);
        tone.connect(gain); gain.connect(context.destination); tone.start(); tone.stop(context.currentTime + .55);
        tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      }
    }
    function tick() {
      setNow(Date.now());
      if (timer.mode === 'countdown' && timerElapsed(timer, Date.now()) >= timer.duration) { clearTimeout(timeout); clearInterval(interval); complete(); }
    }
    if (timer.mode === 'countdown') timeout = setTimeout(() => { clearInterval(interval); complete(); }, Math.max(0, timer.duration - timerElapsed(timer, Date.now())));
    if (visible) interval = setInterval(tick, 500);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [timer, desktopActive, visible, onNotify]);
  function enableSound(event) {
    setSound(event.target.checked);
    if (event.target.checked) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) { try { audio.current ||= new Audio(); audio.current.resume().catch(() => {}); } catch { setSound(false); } }
      else setSound(false);
    }
  }
  function toggle() {
    const stamp = Date.now(); setNow(stamp);
    audio.current?.resume().catch(() => {});
    setTimer(previous => previous.running ? { ...previous, elapsed: timerElapsed(previous, stamp), running: false } : { ...previous, elapsed: previous.completed ? 0 : previous.elapsed, completed: false, running: true, startedAt: stamp });
  }
  const elapsed = timerElapsed(timer, now), remaining = timer.mode === 'countdown' ? timer.duration - elapsed : elapsed;
  const seconds = timer.mode === 'countdown' ? Math.ceil(remaining / 1000) : Math.floor(remaining / 1000);
  const display = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <div className="linux-utility linux-timer">
    <div className="linux-segmented" role="group" aria-label="Timer mode">{['countdown', 'stopwatch'].map(mode => <button type="button" key={mode} aria-pressed={timer.mode === mode} disabled={timer.running} onClick={() => { setTimer({ ...initial, mode, duration: timer.duration }); setNow(Date.now()); }}>{mode === 'countdown' ? 'Focus timer' : 'Stopwatch'}</button>)}</div>
    <div className="linux-timer-face"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90" /><circle className="linux-timer-progress" cx="100" cy="100" r="90" pathLength="100" strokeDasharray="100" strokeDashoffset={timer.mode === 'countdown' ? elapsed / timer.duration * 100 : 0} /></svg><div><span className="linux-eyebrow">{timer.completed ? 'Nicely done' : timer.running ? 'One thing at a time' : 'Make a little room'}</span><output aria-label="Timer time">{display}</output><span>{timer.completed ? 'Time for a break.' : timer.mode === 'countdown' ? 'minutes / seconds' : 'Every little bit counts.'}</span></div></div>
    {timer.mode === 'countdown' && <label className="linux-timer-duration">Focus for <input aria-label="Focus minutes" type="number" min="1" max="180" step="1" disabled={timer.running} value={timer.duration / 60000} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= 180) setTimer(previous => ({ ...previous, duration: value * 60000, elapsed: 0, completed: false })); }} /> minutes</label>}
    <div className="linux-timer-actions"><button type="button" className="linux-primary" disabled={!desktopActive} onClick={toggle}>{timer.running ? 'Pause timer' : timer.elapsed && !timer.completed ? 'Resume timer' : 'Start timer'}</button><button type="button" onClick={() => setTimer(previous => ({ ...previous, running: false, elapsed: 0, completed: false }))}>Reset</button></div>
    <label className="linux-timer-sound"><input type="checkbox" checked={sound} onChange={enableSound} /> Sound when focus ends</label>
    <p className="linux-utility-status" role="status">{timer.completed ? 'Focus session complete.' : 'Closing or pausing the desktop pauses your timer.'}</p>
  </div>;
}
