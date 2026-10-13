import { useEffect, useRef, useState } from 'react';

const timing = { idle: 650, walk: 170, train: 130, pet: 240, feed: 380, rest: 1000, evolve: 1000 };

export function PetSprite({ stage, action = 'idle', active, reduced, onPet, disabled }) {
  const element = useRef(null), position = useRef(.5), direction = useRef(-1);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const image = new Image(); setFailed(false);
    image.onerror = () => { if (live) setFailed(true); };
    image.src = stage.sheet;
    return () => { live = false; image.onerror = null; };
  }, [stage.sheet]);

  useEffect(() => {
    const sprite = element.current;
    if (!sprite) return;
    const habitat = sprite.parentElement;
    let frame = 0, previous = 0, elapsed = 0, remaining = 1800, walking = false, distance = 0;
    const measure = () => { distance = Math.max(0, habitat.clientWidth - sprite.offsetWidth - 24); place(); };
    function place() {
      sprite.style.left = `${12 + position.current * distance}px`;
      sprite.style.setProperty('--pet-facing', direction.current === 1 ? -1 : 1);
    }
    function paint(clip, time) {
      const frames = stage.clips[clip] || stage.clips.idle;
      const index = frames[Math.floor(time / timing[clip]) % frames.length];
      sprite.style.backgroundPosition = `${-index * stage.cell * stage.scale}px 0`;
      sprite.dataset.clip = clip;
    }
    function tick(now) {
      const delta = previous ? Math.min(60, now - previous) : 0; previous = now; elapsed += delta;
      let clip = action;
      if (action === 'idle') {
        remaining -= delta;
        if (remaining <= 0) {
          walking = !walking; remaining = walking ? 2200 + Math.random() * 2800 : 1400 + Math.random() * 2600;
          if (walking && Math.random() > .6) direction.current *= -1;
        }
        if (walking && distance > 0) {
          position.current += direction.current * delta * .018 / distance;
          if (position.current <= 0 || position.current >= 1) { position.current = Math.min(1, Math.max(0, position.current)); direction.current *= -1; walking = false; remaining = 1600; }
        }
        clip = walking ? 'walk' : 'idle';
      }
      paint(clip, elapsed); place(); frame = requestAnimationFrame(tick);
    }
    const observer = new ResizeObserver(measure); observer.observe(habitat); measure(); paint(action, 0);
    if (active && !reduced && action !== 'rest' && action !== 'evolve' && !failed) frame = requestAnimationFrame(tick);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [stage, action, active, reduced, failed]);

  return <button ref={element} type="button" className={`digimon-sprite${failed ? ' is-unavailable' : ''}`} aria-label={`Pet ${stage.name}`} onClick={onPet} disabled={disabled} style={{ width: stage.cell * stage.scale, height: stage.cell * stage.scale, backgroundImage: failed ? 'none' : `url(${stage.sheet})`, backgroundSize: `${stage.frames * stage.cell * stage.scale}px ${stage.cell * stage.scale}px` }}>
    {failed && <span>{stage.name}<small>Sprite unavailable</small></span>}
  </button>;
}
