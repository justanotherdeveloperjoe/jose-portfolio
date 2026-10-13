import { Component, useEffect, useRef, useState } from 'react';
import { stageById, stages } from '../../data/digimon/stages.js';
import { useDigimonPet } from '../../hooks/useDigimonPet.js';
import { condition, evolutionProgress } from '../../lib/digimon/engine.js';
import { PetHabitat } from './PetHabitat.jsx';
import { PetControls } from './PetControls.jsx';
import { PetStats } from './PetStats.jsx';
import './DigimonPet.css';

export function DigimonPetCard() {
  return <PetBoundary><PetCard /></PetBoundary>;
}

class PetBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <figure className="digimon-card" id="monterrey"><div className="digimon-paper digimon-fallback"><h3>A little digital company.</h3><p>My companion needs a moment. Your saved progress is kept in this browser.</p><button type="button" onClick={() => this.setState({ failed: false })}>Try again</button></div></figure>;
    return this.props.children;
  }
}

function PetCard() {
  const card = useRef(null);
  const [visible, setVisible] = useState(false), [reduced, setReduced] = useState(false), [flipped, setFlipped] = useState(false), [paused, setPaused] = useState(false);
  const { pet, act, active, message, storageNotice } = useDigimonPet(visible && !flipped && !paused);
  const stage = stageById(pet.stage), progress = evolutionProgress(pet);
  useEffect(() => {
    if (!progress.next) return;
    const image = new Image(); image.src = stageById(progress.next).sheet;
  }, [progress.next]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches); sync(); media.addEventListener('change', sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(card.current);
    return () => { media.removeEventListener('change', sync); observer.disconnect(); };
  }, []);
  return <figure className="digimon-card" ref={card} id="monterrey">
    <div className={`digimon-flipper${flipped ? ' is-flipped' : ''}`}>
      <div className="digimon-paper digimon-front" aria-hidden={flipped} inert={flipped ? '' : undefined}>
        <div className="digimon-card-heading"><span>A little digital company.</span><span>0{stages.indexOf(stage) + 1} / 04</span></div>
        <PetHabitat stage={stage} action={pet.activity} active={active} reduced={reduced} onPet={() => act('pet')} disabled={!active || pet.activity !== 'idle' || (pet.cooldowns.pet || 0) > pet.updatedAt} nextName={stageById(pet.pendingStage).name} />
        <div className="digimon-identity"><h3>{stage.name}</h3><span>{condition(pet)}</span></div>
        <PetStats pet={pet} />
        <PetControls pet={pet} now={pet.updatedAt} onAction={act} paused={paused} />
        <p className="digimon-message" role="status">{message}</p>
        {storageNotice && <p className="digimon-storage-notice">{storageNotice}</p>}
        <details className="digimon-journal"><summary>Care journal & credits <span aria-hidden="true">+</span></summary>
          <dl><div><dt>Age</dt><dd>{Math.floor(Math.max(0, pet.updatedAt - pet.createdAt) / 60000)} min</dd></div><div><dt>Training</dt><dd>{pet.training}</dd></div><div><dt>Care mistakes</dt><dd>{pet.careMistakes}</dd></div></dl>
          {progress.next ? <><p>Next: {stageById(progress.next).name}. Meet each condition while your companion is awake.</p><ul>{progress.requirements.map(item => <li key={item.label}><span>{item.label}</span><span>{Math.floor(item.value)} / {item.needed}{item.unit} {item.value >= item.needed ? '✓' : ''}</span></li>)}</ul></> : <p>The full evolution line is complete. Keep feeding, training, resting, and spending time together.</p>}
          <p>Time together counts while this card is active. A short rest restores energy. Care mistakes add a small, recoverable training requirement.</p>
          <p>{storageNotice || 'Progress stays in this browser. Offline changes are gentle and capped.'}</p>
          <p>Unofficial fan project. Digimon belongs to its respective rights holders. No affiliation or endorsement.</p>
          <p>World DS sprite rips: Mighty Jetters, redblueyellow, A.J. Nitro, RadSpyro, and Dazz. <a href="/sprites/digimon/credits.txt" target="_blank" rel="noreferrer">Sources & animation notes ↗</a></p>
          <p>Walking uses original frames. Feeding, resting, and training use existing poses with simplified cues; dedicated care sprites were unavailable.</p>
        </details>
      </div>
      <div className="digimon-paper digimon-note" id="digimon-note" aria-hidden={!flipped} inert={!flipped ? '' : undefined}>
        <div className="digimon-note-meta"><span>A NOTE FROM JOSE</span><span>MONTERREY, MÉXICO</span></div>
        <h3>Still curious.<br /><em>Still me.</em></h3>
        <p>I build websites for real businesses, and each project gives me something new to figure out.</p>
        <p>Digimon is one of the things I enjoy outside of building websites. This little companion is a place for that part of me, too.</p>
        <p>Right now, I’m sharpening my JavaScript and React skills while exploring Python, SQL, and the cloud.</p>
        <p className="digimon-signoff">Still learning. Still building.<span>— Jose</span></p>
        <a href="#learning">What I’m learning <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <figcaption className="digimon-card-footer"><button type="button" aria-expanded={flipped} aria-controls="digimon-note" onClick={() => setFlipped(value => !value)}>{flipped ? `Back to ${stage.name}` : 'A note from Jose'} <span aria-hidden="true">↻</span></button><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button></figcaption>
  </figure>;
}
