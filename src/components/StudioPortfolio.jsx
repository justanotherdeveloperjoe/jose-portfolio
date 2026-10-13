import { useEffect, useRef, useState } from 'react';
import { projects } from '../data/projects.js';
import { useLocalClock } from '../hooks/useLocalClock.js';
import { Workbench } from './Workbench.jsx';
import { CompositionPlayground } from './CompositionPlayground.jsx';
import { MonterreyPostcard } from './MonterreyPostcard.jsx';
import { MountainSignature } from './ProjectVisuals.jsx';
import { LearningSection } from './LearningSection.jsx';
import { SpaceArcade } from './SpaceArcade.jsx';
import { SandboxSection } from './sandbox/SandboxSection.jsx';
import { ServicesSection } from './ServicesSection.jsx';

const bySlug = slug => projects.find(project => project.slug === slug);
const deckLeads = ['el-sotano-comico', 'propiedades-allende', 'afh-logistics'].map(bySlug);
const liveProjects = [...deckLeads, ...projects.filter(project => project.status === 'live' && !deckLeads.includes(project))];
// Alternates light and dark artwork in every column count (3, 2 and 1).
const workbenchProjects = ['ikinuki-trip-agency', 'propiedades-allende', 'afh-logistics', 'tk-industrial', 'el-sotano-comico', 'nutriologa-allende', 'wolf-fitness'].map(bySlug);
const pad = number => String(number).padStart(2, '0');
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
          <div className="studio-window-bar"><span>● ● ●</span><span>{project.url ? project.url.replace(/^https?:\/\//, '') : 'Project preview / launching soon'}</span><span>↗</span></div>
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

function SelectedWork() {
  const liveCount = workbenchProjects.filter(project => project.status === 'live').length;
  return <section className="studio-work studio-wrap" id="work" aria-labelledby="work-title">
    <Workbench projects={workbenchProjects}>
      <div><span className="studio-kicker">01 / Selected work</span><h2 id="work-title">Different businesses.<br /><em>Different worlds.</em></h2></div>
      <div className="workbench-intro-copy"><p>Live websites, independent work,<br />and studies still on the workbench.<br />A different answer every time.</p><p className="workbench-legend"><span className="is-live"><i aria-hidden="true" />{pad(liveCount)} Live</span><span className="is-progress"><i aria-hidden="true" />{pad(workbenchProjects.length - liveCount)} In progress</span></p></div>
    </Workbench>
  </section>;
}

export function StudioPortfolio() {
  const time = useLocalClock();
  const [arcadeRequest, setArcadeRequest] = useState(0);
  return <div className="studio" id="top">
    <a className="studio-skip" href="#main">Skip to content</a>
    <header className="studio-nav studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span>✳</span></a><span className="studio-nav-note">Independent developer<br />Monterrey, México</span><nav aria-label="Main navigation"><a href="#work">Work <span>{pad(workbenchProjects.length)}</span></a><a href="#playground">Playground</a><a href="#about">About</a><a href="#services">Services</a><a className="studio-nav-contact" href={email}>Let’s talk ↗</a></nav></header>
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
      <SelectedWork />
      <section className="studio-playground" id="playground" aria-labelledby="playground-title">
        <div className="studio-wrap">
          <div className="playground-topline"><span>AN OPEN INVITATION TO PLAY</span><Asterisk /><span>NO RIGHT ANSWERS HERE.</span></div>
          <div className="studio-section-heading"><div><span className="studio-kicker">02 / The playground</span><h2 id="playground-title">Curiosity,<br /><em>with a browser.</em></h2></div><p>One composition. Four ways to play.<br />A little piece of Monterrey, made yours.</p></div>
          <CompositionPlayground />
          <SpaceArcade openRequest={arcadeRequest} />
          <div className="playground-bottomline"><span>A FEW IDEAS, LEFT OPEN.</span><span>Made to be played with. <span aria-hidden="true">↗</span></span></div>
        </div>
      </section>
      <section className="studio-about studio-wrap" id="about" aria-labelledby="about-title"><MonterreyPostcard time={time} /><div><span className="studio-kicker">03 / Behind the browser</span><h2 id="about-title">A person who likes<br /><em>figuring things out.</em></h2><p>I’m Jose. I build interfaces for businesses with very different worlds: comedy, real estate, logistics, fitness, and more. I’m interested in the details that make each one feel like itself.</p><a className="studio-learning-link" href="#learning">See what I’m learning <span aria-hidden="true">↘</span></a><div className="studio-about-tools"><span>Currently building with</span><span>React / JavaScript / CSS / Vite</span></div></div></section>
      <LearningSection />
      <SandboxSection onArcade={() => setArcadeRequest(value => value + 1)} />
      <ServicesSection />
      <section className="studio-contact studio-wrap" id="contact"><span className="studio-kicker">Have something in mind?</span><a href={email}>Let’s make<br /><em>something good.</em><span aria-hidden="true">↗</span></a><div className="studio-contact-bottom"><span>A website. An idea. A good conversation.</span><a href={email}>devilfruitd3v@proton.me ↗</a></div></section>
    </main><MountainSignature /><footer className="studio-footer studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span>✳</span></a><span>Jose Sanchez © {new Date().getFullYear()}</span><a href="#top">Back to the top ↑</a></footer>
  </div>;
}
