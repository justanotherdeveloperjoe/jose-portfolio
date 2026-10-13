// Cumulative care time and training: a few minutes for the first evolution,
// roughly nine active minutes for the whole line. Future branches fit here.
export const evolutionRules = [
  { from: 'agumon', to: 'greymon', activeSeconds: 120, training: 24, happiness: 55, food: 35, energy: 25 },
  { from: 'greymon', to: 'metalgreymon', activeSeconds: 300, training: 56, happiness: 60, food: 40, energy: 30 },
  { from: 'metalgreymon', to: 'wargreymon', activeSeconds: 540, training: 96, happiness: 65, food: 40, energy: 30 },
];
export const evolutionFor = stage => evolutionRules.find(rule => rule.from === stage);
export const trainingNeeded = (rule, mistakes) => rule.training + Math.min(3, mistakes) * 4;
