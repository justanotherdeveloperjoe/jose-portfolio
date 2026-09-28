import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './MonterreyPostcard.css';

gsap.registerPlugin(ScrollTrigger);

const buildings = [
  { x: 22, y: 227, w: 28, h: 48 }, { x: 57, y: 208, w: 35, h: 67 },
  { x: 100, y: 239, w: 22, h: 36 }, { x: 133, y: 185, w: 32, h: 90 },
  { x: 174, y: 221, w: 40, h: 54 }, { x: 225, y: 203, w: 29, h: 72 },
  { x: 268, y: 235, w: 34, h: 40 }, { x: 310, y: 159, w: 25, h: 116 },
  { x: 346, y: 218, w: 34, h: 57 }, { x: 391, y: 238, w: 29, h: 37 },
];

export function MonterreyPostcard({ time }) {
  const [mode, setMode] = useState('Auto');
  const [flipped, setFlipped] = useState(false);
  const card = useRef(null);
  const flip = useRef(null);
  const tilt = useRef(null);
  const hour = Number(time.split(':')[0]);
  const isNight = mode === 'Night' || (mode === 'Auto' && (hour < 7 || hour >= 19));

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const select = gsap.utils.selector(card);
      gsap.timeline({ scrollTrigger: { trigger: card.current, start: 'top 85%', once: true } })
        .from(select('.postcard-entrance'), { y: 28, rotation: 4, opacity: 0, duration: .75, ease: 'power2.out' })
        .from(select('.postcard-mountain-back'), { y: 18, duration: .8 }, .1)
        .from(select('.postcard-mountain-front'), { y: 26, duration: .8 }, .2)
        .from(select('.postcard-buildings'), { y: 35, duration: .65 }, .3)
        .from(select('.postcard-windows'), { opacity: .15, duration: .3, stagger: .018 }, .55)
        .from(select('.postcard-stamp'), { scale: 1.5, opacity: 0, rotation: -25, duration: .4, ease: 'back.out(2)' }, .7);
    }, card);
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const element = card.current;
      const select = gsap.utils.selector(card);
      const rotateX = gsap.quickTo(tilt.current, 'rotationX', { duration: .5 });
      const rotateY = gsap.quickTo(tilt.current, 'rotationY', { duration: .5 });
      const moveBack = gsap.quickTo(select('.postcard-parallax-back')[0], 'x', { duration: .6 });
      const moveFront = gsap.quickTo(select('.postcard-parallax-front')[0], 'x', { duration: .6 });
      const moveCity = gsap.quickTo(select('.postcard-parallax-city')[0], 'x', { duration: .6 });
      function move(event) {
        if (event.pointerType === 'touch') return;
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        rotateX(-y * 7); rotateY(x * 9);
        moveBack(x * 3); moveFront(x * 7); moveCity(x * 11);
      }
      function reset() { rotateX(0); rotateY(0); moveBack(0); moveFront(0); moveCity(0); }
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', reset);
      element.addEventListener('pointercancel', reset);
      return () => {
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', reset);
        element.removeEventListener('pointercancel', reset);
      };
    }, card);
    return () => media.revert();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let tween;
    const turn = () => {
      tween?.kill();
      tween = gsap.to(flip.current, { rotationY: flipped ? 180 : 0, duration: media.matches ? 0 : .75, ease: 'power2.inOut', overwrite: true });
    };
    turn();
    media.addEventListener('change', turn);
    return () => { tween?.kill(); media.removeEventListener('change', turn); };
  }, [flipped]);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const select = gsap.utils.selector(card);
      gsap.fromTo(select('.postcard-windows'), { opacity: .2 }, { opacity: isNight ? 1 : .65, duration: .35, stagger: .018 });
      gsap.fromTo(select(isNight ? '.postcard-moon' : '.postcard-sun'), { y: 30 }, { y: 0, duration: .8, ease: 'power2.out' });
    }, card);
    return () => media.revert();
  }, [isNight]);

  return <figure ref={card} className={`studio-postcard postcard-interactive ${isNight ? 'is-night' : 'is-day'}`} id="monterrey">
    <div className="postcard-entrance"><div className="postcard-tilt" ref={tilt}>
    <span className="postcard-stamp" aria-hidden="true">✳</span>
    <div className="postcard-flipper" ref={flip}>
    <div className="postcard-face postcard-front" aria-hidden={flipped} inert={flipped ? '' : undefined}>
    <div className="postcard-topline"><span>A little piece of home.</span><span aria-hidden="true">↗</span></div>
    <svg className="postcard-scene" viewBox="0 0 440 300" role="img" aria-label={`An illustrated Monterrey skyline and mountain silhouette at ${isNight ? 'night' : 'day'}`}>
      <rect className="postcard-sky" width="440" height="300" />
      <g className="postcard-stars" fill="#ebe3b7">{[[43, 52], [112, 29], [190, 74], [239, 38], [292, 85], [371, 34], [400, 103], [77, 99]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 2} />)}<path d="M162 39v10m-5-5h10" stroke="#ebe3b7" /></g>
      <circle className="postcard-sun" cx="337" cy="75" r="28" />
      <path className="postcard-moon" d="M349 44a28 28 0 1 0 12 47 30 30 0 0 1-12-47Z" />
      <g className="postcard-clouds" fill="none" strokeLinecap="round" strokeWidth="3"><path d="M39 82h47m-27 8h57M228 47h37m-17 9h48" /></g>
      <g className="postcard-parallax-back"><path className="postcard-mountain-back" d="m-12 192 55-25 33 10 58-78 37 23 40-51 35 25 31 60 35 21 26-27 39 40 75-14v124H-12Z" /></g>
      <g className="postcard-parallax-front">
      <path className="postcard-mountain-front" d="m0 236 53-42 28 12 65-67 27-16 31 36 26 4 43-44 22 16 27 68 42 5 42 38 34-14v68H0Z" />
      <path className="postcard-ridge" d="m81 206 65-67 27-16 31 36 26 4 43-44 22 16" fill="none" strokeWidth="1" />
      </g><g className="postcard-parallax-city">
      <g className="postcard-buildings">{buildings.map((building, index) => <g key={building.x}><rect x={building.x} y={building.y} width={building.w} height={building.h} rx="1" />{index === 7 && <path d="M322 141v18" stroke="currentColor" strokeWidth="2" />}{Array.from({ length: Math.floor(building.h / 17) }).map((_, row) => <g className="postcard-windows" key={row}><rect x={building.x + 6} y={building.y + 9 + row * 15} width="4" height="5" /><rect x={building.x + building.w - 10} y={building.y + 9 + row * 15} width="4" height="5" /></g>)}</g>)}</g>
      </g><path className="postcard-ground" d="M0 275h440v25H0Z" /><path d="M20 287h65m12 0h38m110 0h63m13 0h99" className="postcard-street" fill="none" strokeWidth="1" />
    </svg>
    <div className="postcard-location"><span>MONTERREY, MX</span><span>{time} <i aria-hidden="true" /></span></div><div className="postcard-controls" role="group" aria-label="Monterrey scene lighting">{['Auto', 'Day', 'Night'].map(option => <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>{option}</button>)}</div><p className="postcard-caption">{mode === 'Auto' ? 'Following local hours. Day from 07:00 to 19:00.' : `${mode} preview. Switch to Auto to follow local time.`}</p>
    </div>
    <div className="postcard-face postcard-back" id="postcard-note" aria-hidden={!flipped} inert={!flipped ? '' : undefined}>
      <div className="postcard-back-top"><span>A NOTE FROM JOSE</span><span className="postcard-postmark">MONTERREY<br /><b>↗</b><br />MÉXICO</span></div>
      <h3>From Monterrey,<br /><em>with curiosity.</em></h3>
      <p>I build websites for real businesses, and each project gives me something new to figure out.</p>
      <p>Right now, I’m sharpening my JavaScript and React skills while exploring Python, SQL, and the cloud.</p>
      <p className="postcard-signoff">Still learning. Still building.<span>— Jose</span></p>
      <a href="#learning">What I’m learning <span aria-hidden="true">↗</span></a>
    </div></div></div></div>
    <figcaption className="postcard-flip-caption"><button type="button" aria-expanded={flipped} aria-controls="postcard-note" onClick={() => setFlipped(value => !value)}>{flipped ? 'Back to Monterrey' : 'A note from Jose'} <span aria-hidden="true">↻</span></button><span>{flipped ? 'A little about the person.' : 'There’s a story on the other side.'}</span></figcaption>
  </figure>;
}
