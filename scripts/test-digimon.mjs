import assert from 'node:assert/strict';
import { createPet, advancePet, actOnPet, evolutionProgress } from '../src/lib/digimon/engine.js';
const start = 1800000000000;
let pet = createPet(start);
let result = actOnPet(pet, 'feed', start); assert.equal(result.pet.food, 100);
assert.equal(actOnPet(result.pet, 'train', start + 1).pet.training, 0, 'Actions cannot overlap');
pet = advancePet(result.pet, start + 2000, { active: true });
assert.equal(actOnPet(pet, 'feed', start + 2000).pet, pet, 'Cooldown enforced');
result = actOnPet(pet, 'train', start + 2000); assert.equal(result.pet.training, 8); assert.ok(result.pet.energy < pet.energy);
pet = advancePet(result.pet, start + 5000, { active: true });
pet = actOnPet(pet, 'rest', start + 5000).pet;
assert.equal(actOnPet(pet, 'feed', start + 6000).pet, pet, 'Sleeping blocks other actions');
const rested = advancePet(pet, start + 10000, { active: true }); assert.ok(rested.energy > pet.energy);
assert.equal(actOnPet(rested, 'rest', start + 10000).pet.activity, 'idle');
const offline = advancePet(createPet(start), start + 365 * 86400000);
assert.ok(offline.food >= 20); assert.equal(offline.activeAgeMs, 0); assert.equal(offline.careMistakes, 0); assert.equal(offline.stage, 'agumon');
assert.deepEqual(advancePet(createPet(start), start - 1000), createPet(start), 'Clock rollback cannot reverse time');
pet = { ...createPet(start), food: 0, energy: 0 };
for (let t = 1000; t <= 180000; t += 1000) pet = advancePet(pet, start + t, { active: true });
assert.equal(pet.careMistakes, 1, 'One mistake per neglect episode');
assert.ok(evolutionProgress(pet).requirements.find(r => r.label === 'Training').needed > 24);
console.log('Care checks passed: actions, cooldowns, rest, bounded decay, clocks and neglect episodes.');

const { decodePet, readPet, writePet } = await import('../src/lib/digimon/storage.js');
const { stages } = await import('../src/data/digimon/stages.js');
const { evolutionRules } = await import('../src/data/digimon/evolutionRules.js');
const memory = new Map(), storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
for (const stage of stages) {
  writePet({ ...createPet(start), stage: stage.id, training: 50 }, start, storage);
  assert.equal(readPet(start + 1000, storage).pet.stage, stage.id);
  assert.equal(readPet(start + 1000, storage).pet.training, 50);
  memory.clear();
}
for (const invalid of ['{broken', 'null', '[]', '{"version":999}', '{"version":1,"stage":"pikachu"}']) assert.equal(decodePet(invalid, start), null);
let malformed = { ...createPet(start), food: -50, happiness: 800, energy: 'lots', training: null, cooldowns: null, updatedAt: start * 2 };
const sanitized = decodePet(JSON.stringify(malformed), start);
assert.equal(sanitized.food, 0); assert.equal(sanitized.happiness, 100); assert.equal(sanitized.energy, 80); assert.equal(sanitized.updatedAt, start);
const denied = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Denied'); } };
assert.match(readPet(start, denied).notice, /unavailable/); assert.match(writePet(createPet(start), start, denied).notice, /unavailable/);
writePet({ ...createPet(start), revision: 5, training: 64 }, start, storage);
assert.equal(writePet(createPet(start), start + 1, storage).pet.training, 64, 'Stale tabs cannot overwrite newer progress');
memory.clear();
console.log('Persistence checks passed: every stage, malformed and old saves, denied storage, clock skew and stale tabs.');

for (const rule of evolutionRules) {
  pet = { ...createPet(start), stage: rule.from, training: rule.training, activeAgeMs: rule.activeSeconds * 1000, food: 100, happiness: 100, energy: 100 };
  pet = advancePet(pet, start + 1000, { active: true });
  assert.equal(pet.activity, 'evolve'); assert.equal(pet.pendingStage, rule.to);
  assert.equal(actOnPet(pet, 'feed', start + 1100).pet, pet);
  const resumed = decodePet(JSON.stringify(pet), start + 1200);
  assert.equal(resumed.pendingStage, rule.to);
  const evolved = advancePet(resumed, start + 5000);
  assert.equal(evolved.stage, rule.to); assert.equal(evolved.activity, 'idle');
  assert.equal(advancePet(evolved, start + 6000).stage, rule.to, 'Reload cannot chain offline evolutions');
}
pet = { ...createPet(start), stage: 'wargreymon' };
assert.equal(evolutionProgress(pet).percent, 100); assert.equal(evolutionProgress(pet).next, null);
assert.equal(actOnPet(pet, 'train', start).pet.training, 8, 'Mega remains interactive');
console.log('Evolution checks passed: all transitions, action lock, mid-evolution restore and Mega care.');
