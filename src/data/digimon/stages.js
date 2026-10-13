// All frames are from the audited World DS sheets. Care actions reuse these
// poses with UI cues; dedicated eating / sleeping art is not in this set.
const standard = { idle: [6, 7, 6], walk: [3, 4, 5, 4], pet: [6, 8, 6], feed: [6, 7], rest: [6], train: [3, 4, 5, 4], evolve: [6] };
export const stages = [
  { id: 'agumon', name: 'Agumon', rank: 'Rookie', frames: 9, clips: standard },
  { id: 'greymon', name: 'Greymon', rank: 'Champion', frames: 9, clips: standard },
  { id: 'metalgreymon', name: 'MetalGreymon', rank: 'Ultimate', frames: 5, clips: { idle: [3, 4, 3], walk: [0, 1, 2, 1], pet: [3, 4], feed: [3, 4], rest: [3], train: [0, 1, 2, 1], evolve: [3] } },
  { id: 'wargreymon', name: 'WarGreymon', rank: 'Mega', frames: 9, clips: standard },
].map(stage => ({ ...stage, sheet: `/sprites/digimon/${stage.id}.png`, cell: 56, scale: 3 }));
export const stageById = id => stages.find(stage => stage.id === id) || stages[0];
