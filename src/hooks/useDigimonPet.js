import { useCallback, useEffect, useRef, useState } from 'react';
import { actOnPet, advancePet } from '../lib/digimon/engine.js';
import { stageById } from '../data/digimon/stages.js';
import { decodePet, newerSave, PET_KEY, readPet, writePet } from '../lib/digimon/storage.js';

export function useDigimonPet(visible) {
  const initial = useRef(null), latest = useRef(null);
  if (!initial.current) initial.current = readPet(Date.now());
  if (!latest.current) latest.current = initial.current.pet;
  const [pet, setPet] = useState(latest.current), [message, setMessage] = useState('A small tribute to my love of Digimon.');
  const [storageNotice, setStorageNotice] = useState(initial.current.notice);
  const [foreground, setForeground] = useState(!document.hidden);
  const active = visible && foreground;
  const commit = useCallback((next, save = false) => {
    const before = latest.current;
    let synced = false;
    if (save || next.stage !== before.stage || (next.activity === 'evolve' && before.activity !== 'evolve')) {
      const result = writePet(next, Date.now()); next = result.pet; setStorageNotice(result.notice);
      synced = result.synced;
      if (result.synced) setMessage('Progress updated from your other tab.');
    }
    latest.current = next; setPet(next);
    if (next.stage !== before.stage) setMessage(`Meet ${stageById(next.stage).name}. Your companion has Digivolved.`);
    else if (next.activity === 'evolve' && before.activity !== 'evolve') setMessage(`Digivolving into ${stageById(next.pendingStage).name}.`);
    return synced;
  }, []);
  useEffect(() => {
    const sync = () => { if (document.hidden) commit(latest.current, true); setForeground(!document.hidden); };
    const flush = () => commit(latest.current, true);
    const receive = event => {
      if (event.key !== PET_KEY) return;
      const remote = decodePet(event.newValue, Date.now());
      if (newerSave(remote, latest.current)) { commit(advancePet(remote, Date.now())); setMessage('Progress updated from your other tab.'); }
    };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', flush);
    window.addEventListener('storage', receive);
    return () => { document.removeEventListener('visibilitychange', sync); window.removeEventListener('pagehide', flush); window.removeEventListener('storage', receive); };
  }, [commit]);
  useEffect(() => {
    if (!active) return;
    commit(advancePet(latest.current, Date.now()));
    const clock = setInterval(() => { const now = Date.now(); commit(advancePet(latest.current, now, { active: true }), now - latest.current.lastSavedAt >= 30000); }, 1000);
    return () => { clearInterval(clock); commit(latest.current, true); };
  }, [active, commit]);
  const act = action => {
    if (!active) return;
    const now = Date.now(), remote = readPet(now).pet;
    const current = advancePet(newerSave(remote, latest.current) ? remote : latest.current, now, { active: true });
    const result = actOnPet(current, action, now);
    if (!commit(result.pet, true)) setMessage(result.message);
  };
  return { pet, act, active, message, storageNotice };
}
