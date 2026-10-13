import { PetSprite } from './PetSprite.jsx';
import { MonterreyHabitat } from './MonterreyHabitat.jsx';

const cues = { feed: 'A little snack.', train: 'One more rep.', rest: 'Taking it easy. z z z', pet: 'Good company.', evolve: 'A little more extraordinary.' };
export function PetHabitat({ stage, action, active, reduced, onPet, disabled, nextName }) {
  return <div className={`digimon-habitat${action === 'evolve' ? ' is-evolving' : ''}`}>
    <MonterreyHabitat />
    <div className="digimon-habitat-meta" aria-hidden="true"><span>MONTERREY / DIGITAL COMPANION</span><span>{stage.rank}</span></div>
    <div className="digimon-floor" aria-hidden="true" />
    <PetSprite stage={stage} action={action} active={active} reduced={reduced} onPet={onPet} disabled={disabled} />
    <span className="digimon-cue" aria-hidden="true">{cues[action] || 'A small world. A little company.'}</span>
    {action === 'evolve' && <span className="digimon-evolution" aria-hidden="true">DIGIVOLVING<em>{nextName}</em></span>}
  </div>;
}
