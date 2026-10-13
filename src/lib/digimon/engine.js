import { evolutionFor, trainingNeeded } from '../../data/digimon/evolutionRules.js';

export const SAVE_VERSION = 1;
export const ACTIONS = {
  feed: { duration: 1800, cooldown: 4000 },
  train: { duration: 2400, cooldown: 6000 },
  pet: { duration: 1600, cooldown: 7000 },
  rest: { duration: 0, cooldown: 0 },
};
const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));
export function createPet(now) {
  return { version: SAVE_VERSION, revision: 0, stage: 'agumon', food: 75, happiness: 70, energy: 80, training: 0, activeAgeMs: 0, careMistakes: 0, neglectMs: 0, neglectCounted: false, createdAt: now, updatedAt: now, lastSavedAt: now, lastInteractionAt: now, activity: 'idle', actionUntil: 0, pendingStage: null, cooldowns: {} };
}
export function evolutionProgress(pet) {
  const rule = evolutionFor(pet.stage);
  if (!rule) return { percent: 100, ready: false, requirements: [], next: null };
  const checks = [
    { label: 'Time together', value: Math.floor(pet.activeAgeMs / 1000), needed: rule.activeSeconds, unit: 's' },
    { label: 'Training', value: pet.training, needed: trainingNeeded(rule, pet.careMistakes), unit: '' },
    { label: 'Happiness', value: pet.happiness, needed: rule.happiness, unit: '' },
    { label: 'Food', value: pet.food, needed: rule.food, unit: '' },
    { label: 'Energy', value: pet.energy, needed: rule.energy, unit: '' },
  ];
  return { next: rule.to, ready: checks.every(c => c.value >= c.needed), percent: Math.floor(100 * Math.min(...checks.map(c => clamp(c.value / c.needed, 0, 1)))), requirements: checks };
}
export function advancePet(pet, now, { active = false } = {}) {
  const elapsed = Math.max(0, now - pet.updatedAt);
  const next = { ...pet, updatedAt: Math.max(now, pet.updatedAt), cooldowns: { ...pet.cooldowns } };
  if (active) {
    // A delayed browser timer cannot award hours of unattended care.
    const ms = Math.min(elapsed, 5000), minutes = ms / 60000;
    const demand = pet.stage === 'agumon' ? 1 : pet.stage === 'greymon' ? 1.1 : 1.2;
    next.activeAgeMs += ms;
    next.food = clamp(pet.food - minutes * 1.5 * demand);
    next.happiness = clamp(pet.happiness - minutes * .5);
    next.energy = clamp(pet.energy + (pet.activity === 'rest' ? ms / 1000 * 3 : -minutes * .8 * demand));
    if (next.food < 15 || next.energy < 10) {
      next.neglectMs += ms;
      if (next.neglectMs >= 60000 && !pet.neglectCounted) { next.careMistakes++; next.neglectCounted = true; }
    } else { next.neglectMs = 0; next.neglectCounted = false; }
  } else {
    const minutes = Math.min(elapsed, 2 * 3600000) / 60000;
    next.food = Math.max(Math.min(pet.food, 20), pet.food - minutes * .12);
    next.happiness = Math.max(Math.min(pet.happiness, 20), pet.happiness - minutes * .1);
    next.energy = pet.activity === 'rest' ? clamp(pet.energy + Math.min(30, minutes * 2)) : Math.max(Math.min(pet.energy, 20), pet.energy - minutes * .05);
  }
  if (pet.activity === 'evolve' && now >= pet.actionUntil) {
    const rule = evolutionFor(pet.stage);
    if (rule?.to === pet.pendingStage) next.stage = pet.pendingStage;
    next.activity = 'idle'; next.pendingStage = null; next.actionUntil = 0;
    // Do not start a second evolution on the same update.
    return next;
  }
  if (!['rest', 'idle', 'evolve'].includes(pet.activity) && now >= pet.actionUntil) { next.activity = 'idle'; next.actionUntil = 0; }
  if (active && next.activity === 'idle' && evolutionProgress(next).ready) {
    next.activity = 'evolve'; next.pendingStage = evolutionFor(next.stage).to; next.actionUntil = now + 2200;
  }
  return next;
}
export function actOnPet(pet, action, now) {
  if (!ACTIONS[action]) return { pet, message: 'Choose Feed, Train, Rest, or Pet.' };
  if (pet.activity === 'evolve') return { pet, message: 'A little patience. Digivolution is underway.' };
  if (pet.activity === 'rest') {
    if (action !== 'rest') return { pet, message: 'Wake your companion before another activity.' };
    return { pet: { ...pet, activity: 'idle', lastInteractionAt: now }, message: 'Rested and ready for a little company.' };
  }
  if (pet.activity !== 'idle') return { pet, message: 'Let this little moment finish first.' };
  if ((pet.cooldowns[action] || 0) > now) return { pet, message: `Ready again in ${Math.ceil((pet.cooldowns[action] - now) / 1000)}s.` };
  if (action === 'train' && (pet.energy < 15 || pet.food < 10)) return { pet, message: 'A snack and a little rest before training.' };
  const next = { ...pet, activity: action, actionUntil: now + ACTIONS[action].duration, lastInteractionAt: now, cooldowns: { ...pet.cooldowns, [action]: now + ACTIONS[action].cooldown } };
  const messages = { feed: 'Snack time. Food +25.', train: 'Nice work. Training +8, energy −12.', rest: 'Resting. Energy is recovering.', pet: 'A little attention goes a long way. Happiness +6.' };
  if (action === 'feed') { next.food = clamp(pet.food + 25); next.happiness = clamp(pet.happiness + 2); }
  if (action === 'train') { next.training += 8; next.energy = clamp(pet.energy - 12); next.food = clamp(pet.food - 5); next.happiness = clamp(pet.happiness + 2); }
  if (action === 'pet') next.happiness = clamp(pet.happiness + 6);
  return { pet: next, message: messages[action] };
}
export function condition(pet) {
  if (pet.activity === 'evolve') return 'Digivolving';
  if (pet.activity === 'rest') return 'Resting';
  if (pet.energy < 25) return 'A little sleepy';
  if (pet.food < 30) return 'Ready for a snack';
  if (pet.happiness < 45) return 'Could use some company';
  return pet.stage === 'wargreymon' ? 'Fully evolved. Still your companion.' : 'Feeling good';
}
