import { stages } from '../../data/digimon/stages.js';
import { evolutionFor } from '../../data/digimon/evolutionRules.js';
import { advancePet, createPet, SAVE_VERSION, ACTIONS } from './engine.js';

export const PET_KEY = 'jose-portfolio:digimon:v1';
const finite = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function decodePet(raw, now) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== SAVE_VERSION || !stages.some(stage => stage.id === value.stage)) return null;
    const next = createPet(now);
    next.stage = value.stage;
    for (const key of ['food', 'happiness', 'energy']) next[key] = finite(value[key], next[key], 0, 100);
    next.training = Math.floor(finite(value.training, 0, 0, 1000000));
    next.activeAgeMs = finite(value.activeAgeMs, 0, 0, 10 * 365 * 86400000);
    next.careMistakes = Math.floor(finite(value.careMistakes, 0, 0, 1000000));
    next.neglectMs = finite(value.neglectMs, 0, 0, 60000);
    next.neglectCounted = value.neglectCounted === true;
    next.revision = Math.floor(finite(value.revision, 0, 0, Number.MAX_SAFE_INTEGER - 1));
    for (const key of ['createdAt', 'updatedAt', 'lastSavedAt', 'lastInteractionAt']) next[key] = finite(value[key], now, 0, now);
    next.createdAt = Math.min(next.createdAt, next.updatedAt);
    next.activity = ['idle', 'rest', 'feed', 'train', 'pet', 'evolve'].includes(value.activity) ? value.activity : 'idle';
    next.actionUntil = finite(value.actionUntil, 0, 0, now + 10000);
    if (next.activity === 'evolve') {
      if (value.pendingStage === evolutionFor(next.stage)?.to) next.pendingStage = value.pendingStage;
      else { next.activity = 'idle'; next.actionUntil = 0; }
    }
    for (const [action, { cooldown }] of Object.entries(ACTIONS)) next.cooldowns[action] = finite(value.cooldowns?.[action], 0, 0, now + cooldown);
    return next;
  } catch { return null; }
}
export const newerSave = (remote, local) => remote && (remote.revision > local.revision || (remote.revision === local.revision && remote.lastSavedAt > local.lastSavedAt));
export function readPet(now, storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(PET_KEY), saved = decodePet(raw, now);
    return { pet: saved ? advancePet(saved, now) : createPet(now), notice: raw && !saved ? 'An older or damaged save was replaced with a fresh companion.' : '' };
  } catch { return { pet: createPet(now), notice: 'This visit only — browser storage is unavailable.' }; }
}
export function writePet(pet, now, storage) {
  try {
    const target = storage ?? window.localStorage;
    const remote = decodePet(target.getItem(PET_KEY), now);
    if (newerSave(remote, pet)) return { pet: advancePet(remote, now), notice: '', synced: true };
    const saved = { ...pet, revision: pet.revision + 1, lastSavedAt: now };
    target.setItem(PET_KEY, JSON.stringify(saved));
    return { pet: saved, notice: '', synced: false };
  } catch { return { pet, notice: 'This visit only — browser storage is unavailable.', synced: false }; }
}
