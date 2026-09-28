import { useEffect, useRef, useState } from 'react';
import { projects } from '../data/projects.js';
import { useLocalClock } from '../hooks/useLocalClock.js';
import { ProjectAnnotations } from './ProjectAnnotations.jsx';
import { afhNotes } from '../data/projectNotes.js';
import { Workbench } from './Workbench.jsx';
import { TypographyPlayground, ThemePlayground } from './ExtraPlaygrounds.jsx';
import { ProjectTransformation } from './ProjectTransformation.jsx';
import { MonterreyPostcard } from './MonterreyPostcard.jsx';
import { ComedyVisual, EstateVisual, LogisticsVisual, MountainSignature } from './ProjectVisuals.jsx';
import { LearningSection } from './LearningSection.jsx';
import { SpaceArcade } from './SpaceArcade.jsx';
import { SandboxSection } from './sandbox/SandboxSection.jsx';

const liveProjects = projects.filter((project) => project.status === 'live');
const upcomingProjects = projects.filter((project) => project.status !== 'live');
const email = 'mailto:devilfruitd3v@proton.me';

function Asterisk({ className = '' }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    {[0, 45, 90, 135].map((angle) => <path key={angle} d="M50 5V95" stroke="currentColor" strokeWidth="15" transform={`rotate(${angle} 50 50)`} />)}
  </svg>;
}

function ProjectDeck() {
  const [selected, setSelected] = useState(0);
  const deck = useRef(null);
  const tilt = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const element = deck.current;
    function reset() {
      tilt.current.style.setProperty('--tilt-x', '0deg');
      tilt.current.style.setProperty('--tilt-y', '0deg');
    }
    function move(event) {
      if (!media.matches || event.pointerType === 'touch') return;
      const bounds = element.getBoundingClientRect();
      tilt.current.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 7}deg`);
      tilt.current.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 9}deg`);
    }
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    media.addEventListener('change', reset);
    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      media.removeEventListener('change', reset);
    };
  }, []);
  const active = liveProjects[selected];
  return <div className="studio-deck" ref={deck}>
    <div className="studio-deck-label"><span>SELECTED WORK / {new Date().getFullYear()}</span><span>A FEW OPEN TABS ↙</span></div>
    <div className="studio-deck-arrival"><div className="studio-deck-stack" ref={tilt}>
      {liveProjects.map((project, index) => {
        const position = (index - selected + liveProjects.length) % liveProjects.length;
        return <a key={project.id} href={`#${project.id}`} className={`studio-deck-card deck-position-${position}`} tabIndex={position === 0 ? 0 : -1} aria-hidden={position !== 0}>
          <div className="studio-window-bar"><span>● ● ●</span><span>{project.url.replace('https://', '')}</span><span>↗</span></div>
          <img src={project.screenshot} alt={`${project.name} website preview`} fetchpriority={index === 0 ? 'high' : 'auto'} />
        </a>;
      })}
    </div></div>
    <div className="studio-deck-controls">
      <span aria-live="polite">0{selected + 1} / 0{liveProjects.length} <span className="studio-deck-current">{active.name}</span></span>
      <div><button type="button" aria-label="Previous project preview" onClick={() => setSelected((selected + liveProjects.length - 1) % liveProjects.length)}>←</button><button type="button" aria-label="Next project preview" onClick={() => setSelected((selected + 1) % liveProjects.length)}>→</button></div>
    </div>
  </div>;
}

function FeaturedWork() {
  const [comedy, estate, logistics] = liveProjects;
  const [notesOpen, setNotesOpen] = useState(false);
  const notesToggle = useRef(null);

  function closeNotes() {
    setNotesOpen(false);
    notesToggle.current?.focus({ preventScroll: true });
    notesToggle.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  return <section className="studio-work studio-wrap" id="work" aria-labelledby="work-title">
    <div className="studio-section-heading"><div><span className="studio-kicker">01 / Selected work</span><h2 id="work-title">Different businesses.<br /><em>Different worlds.</em></h2></div><p>Real clients. Real constraints.<br />A different answer every time.</p></div>
    <article className="studio-feature studio-comedy" id={comedy.id}>
      <div className="studio-feature-copy"><span className="studio-kicker">01 — Media & entertainment</span><h3>Serious about<br /><span>not being<br />serious.</span></h3><p>A home for the jokes.<br />And everything that comes after.</p><a className="studio-project-link" href={comedy.url} target="_blank" rel="noreferrer">{comedy.name}<span aria-hidden="true">↗</span></a></div>
      <ComedyVisual project={comedy} />
      <div className="studio-feature-foot"><span>Newsletter · Social integration · Merch</span><span className="studio-live">Live website ↗</span></div>
    </article>
    <div className="studio-work-pair">
      <article className="studio-feature studio-estate" id={estate.id}>
        <div className="studio-feature-top"><span className="studio-kicker">02 — Real estate</span><span aria-hidden="true">↗</span></div>
        <h3>A little more<br /><em>room to imagine.</em></h3>
        <EstateVisual project={estate} />
        <div className="studio-card-caption"><div><h4>{estate.name}</h4><p>One property. Space to tell its story.</p></div><a href={estate.url} target="_blank" rel="noreferrer" aria-label={`Explore ${estate.name}`}>↗</a></div>
      </article>
      <article className="studio-feature studio-logistics" id={logistics.id}>
        <div className="studio-feature-top"><span className="studio-kicker">03 — Logistics</span><span className="studio-live">Live</span></div>
        <h3>Built to<br />keep moving<span>.</span></h3>
        <div className="studio-route" aria-hidden="true"><span>MONTERREY</span><i /><span>ONWARD ↗</span></div>
        <LogisticsVisual project={logistics} />
        <div className="studio-card-caption"><div><h4>{logistics.name}</h4><p>Cold-chain freight. Clear next steps.</p></div><a href={logistics.url} target="_blank" rel="noreferrer" aria-label={`Explore ${logistics.name}`}>↗</a></div>
        <button ref={notesToggle} type="button" className="studio-peek-toggle" aria-expanded={notesOpen} aria-controls={`${logistics.id}-under-the-hood`} onClick={() => setNotesOpen(!notesOpen)}><span aria-hidden="true">{notesOpen ? '−' : '+'}</span>{notesOpen ? 'Hide the design notes' : 'Peek under the hood'}<span className="studio-peek-count">03 notes</span></button>
      </article>
    </div>
    {notesOpen && <ProjectAnnotations project={logistics} notes={afhNotes} onClose={closeNotes} />}
    <ProjectTransformation project={logistics} />
    <Workbench projects={upcomingProjects} />
  </section>;
}

const easings = { Smooth: 'cubic-bezier(.22,1,.36,1)', Bounce: 'cubic-bezier(.34,1.56,.64,1)', Linear: 'linear' };

function MotionPlayground() {
  const [duration, setDuration] = useState(900);
  const [easing, setEasing] = useState('Bounce');
  const [played, setPlayed] = useState(false);
  const shape = useRef(null);
  const track = useRef(null);
  const animation = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => animation.current?.cancel());
    observer.observe(track.current);
    return () => {
      observer.disconnect();
      animation.current?.cancel();
    };
  }, []);
  function replay() {
    animation.current?.cancel();
    setPlayed(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const distance = Math.max(0, track.current.clientWidth - shape.current.offsetWidth - 32);
    animation.current = shape.current.animate([
      { transform: 'translateX(0) rotate(0deg)' },
      { transform: `translateX(${distance}px) rotate(180deg)` },
    ], { duration, easing: easings[easing], fill: 'forwards' });
  }
  return <article className="studio-lab-card"><div className="studio-lab-heading"><span className="studio-kicker">Experiment 001</span><span>Motion studies</span></div><h3>A little movement.<br />A different feeling.</h3><div className="studio-motion-track" ref={track}><Asterisk className="studio-motion-shape" /><div ref={shape} className="studio-motion-object"><Asterisk /></div></div><div className="studio-motion-settings"><label>Easing<select value={easing} onChange={(event) => setEasing(event.target.value)}>{Object.keys(easings).map((name) => <option key={name}>{name}</option>)}</select></label><label htmlFor="motion-duration">Duration <output>{duration} ms</output><input id="motion-duration" type="range" min="300" max="1800" step="100" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label><button type="button" className="studio-play" onClick={replay}>Play <span aria-hidden="true">↗</span></button></div><p className="studio-lab-caption" aria-live="polite">{played ? `${easing} · ${duration} ms. Change a setting and play again.` : 'Same shape. Same journey. You set the mood.'}<span className="studio-reduced-note"> Reduced motion is on; animation is paused.</span></p></article>;
}

function ResponsivePlayground() {
  const [width, setWidth] = useState(100);
  return <article className="studio-lab-card studio-responsive-lab"><div className="studio-lab-heading"><span className="studio-kicker">Experiment 002</span><span>Responsive systems</span></div><h3>Good design<br />makes room.</h3><div className="studio-responsive-stage"><div className="studio-mini-browser" style={{ width: `${width}%` }}><div className="studio-mini-chrome"><span>● ● ●</span><span>little.website</span></div><div className="studio-mini-content"><span className="studio-mini-label">A small collection</span><div className="studio-mini-grid">{['A', 'B', 'C'].map((item) => <div key={item}><span>{item}</span><i /></div>)}</div></div></div></div><label className="studio-width-label" htmlFor="preview-width">Drag to resize <output>{width}%</output><input id="preview-width" type="range" min="45" max="100" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><p className="studio-lab-caption">The content stays. The composition adapts.</p></article>;
}

export function StudioPortfolio() {
  const time = useLocalClock();
  const [arcadeRequest, setArcadeRequest] = useState(0);
  return <div className="studio" id="top">
    <a className="studio-skip" href="#main">Skip to content</a>
    <header className="studio-nav studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span>✳</span></a><span className="studio-nav-note">Independent developer<br />Monterrey, México</span><nav aria-label="Main navigation"><a href="#work">Work <span>03</span></a><a href="#playground">Playground</a><a href="#about">About</a><a className="studio-nav-contact" href={email}>Let’s talk ↗</a></nav></header>
    <main id="main">
      <section className="studio-hero studio-wrap" aria-labelledby="studio-name">
        <div className="studio-hero-meta"><span className="studio-kicker">A personal corner of the internet</span><span className="studio-available"><i /> Available for freelance & remote</span></div>
        <h1 id="studio-name"><b className="studio-name-text">JOSE SANCHEZ</b><span>®</span></h1>
        <div className="studio-hero-bottom">
          <div className="studio-hero-intro">
            <div className="studio-hero-statement">Useful websites.<br />A little <em>unexpected.</em><Asterisk className="studio-hero-star" /></div>
            <p>I’m a front-end developer in Monterrey, building websites for real businesses. This is where the work meets the experiments.</p>
            <a className="studio-pill" href="#work">Explore my work <Asterisk className="studio-button-star" /></a>
            <div className="studio-hero-footnote"><span>Design-minded.<br />Detail-obsessed.</span><span className="studio-handnote">Always a work in progress.</span></div>
          </div>
          <ProjectDeck />
        </div>
        <div className="studio-hero-baseline"><span>LOCAL TIME {time} / MX</span><span>Scroll a little. Find something good. ↓</span><span>SELECTED WORK & EXPERIMENTS</span></div>
      </section>
      <FeaturedWork />
      <section className="studio-playground" id="playground" aria-labelledby="playground-title">
        <div className="studio-wrap">
          <div className="playground-topline"><span>AN OPEN INVITATION TO PLAY</span><Asterisk /><span>NO RIGHT ANSWERS HERE.</span></div>
          <div className="studio-section-heading"><div><span className="studio-kicker">02 / The playground</span><h2 id="playground-title">Curiosity,<br /><em>with a browser.</em></h2></div><p>Small experiments. No client brief.<br />Go on, touch the controls.</p></div>
          <div className="studio-lab-grid"><MotionPlayground /><ResponsivePlayground /><TypographyPlayground /><ThemePlayground /></div>
          <SpaceArcade openRequest={arcadeRequest} />
          <div className="playground-bottomline"><span>A FEW IDEAS, LEFT OPEN.</span><span>Made to be played with. <span aria-hidden="true">↗</span></span></div>
        </div>
      </section>
      <section className="studio-about studio-wrap" id="about" aria-labelledby="about-title"><MonterreyPostcard time={time} /><div><span className="studio-kicker">03 / Behind the browser</span><h2 id="about-title">A person who likes<br /><em>figuring things out.</em></h2><p>I’m Jose. I build interfaces for businesses with very different worlds: comedy, real estate, logistics, fitness, and more. I’m interested in the details that make each one feel like itself.</p><a className="studio-learning-link" href="#learning">See what I’m learning <span aria-hidden="true">↘</span></a><div className="studio-about-tools"><span>Currently building with</span><span>React / JavaScript / CSS / Vite</span></div></div></section>
      <LearningSection />
      <SandboxSection onArcade={() => setArcadeRequest(value => value + 1)} />
      <section className="studio-contact studio-wrap" id="contact"><span className="studio-kicker">Have something in mind?</span><a href={email}>Let’s make<br /><em>something good.</em><span aria-hidden="true">↗</span></a><div className="studio-contact-bottom"><span>A website. An idea. A good conversation.</span><a href={email}>devilfruitd3v@proton.me ↗</a></div></section>
    </main><MountainSignature /><footer className="studio-footer studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span>✳</span></a><span>Jose Sanchez © {new Date().getFullYear()}</span><a href="#top">Back to the top ↑</a></footer>
  </div>;
}
