import { evolutionProgress } from '../../lib/digimon/engine.js';
import { stageById } from '../../data/digimon/stages.js';

export function PetStats({ pet }) {
  const progress = evolutionProgress(pet);
  return <>
    <div className="digimon-stats">{[['Food', pet.food], ['Happiness', pet.happiness], ['Energy', pet.energy]].map(([label, value]) => <div key={label}><span>{label}<b>{Math.round(value)}</b></span><meter min="0" max="100" value={value} aria-label={label} /></div>)}</div>
    <div className="digimon-progress"><div><span>{progress.next ? `Next / ${stageById(progress.next).name}` : 'Mega / The whole journey'}</span><span>{progress.percent}%</span></div><progress max="100" value={progress.percent} aria-label="Digivolution progress" /></div>
  </>;
}
