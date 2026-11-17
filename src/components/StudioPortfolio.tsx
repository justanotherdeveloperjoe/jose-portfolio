import { ArrowUpRight as PhArrowUpRight, Asterisk as PhAsterisk, User as PhUser, Code as PhCode } from '@phosphor-icons/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { projects } from '../data/projects.ts';
import { useLocalClock } from '../hooks/useLocalClock.ts';
import { Workbench } from './Workbench.tsx';
import { CompositionPlayground } from './CompositionPlayground.tsx';
import { DigimonPetCard } from './digimon/DigimonPetCard.tsx';
import { MountainSignature } from './ProjectVisuals.tsx';
import { LearningSection } from './LearningSection.tsx';
import { SpaceArcade } from './SpaceArcade.tsx';
import { SandboxSection } from './sandbox/SandboxSection.tsx';
import { ServicesSection } from './ServicesSection.tsx';
import { RubiksCube } from './RubiksCube.tsx';
import { ContactSection } from './ContactSection.tsx';
import { IsoCity } from './IsoCity.tsx';
import type { ContactInquiry } from './ContactSection.tsx';
import { sendMessage } from '../lib/sendMessage.ts';

// Only called with the hardcoded slugs below, all of which exist in projects.
const bySlug = (slug: string) => projects.find(project => project.slug === slug)!;
const deckLeads = ['el-sotano-comico', 'propiedades-allende', 'afh-logistics'].map(bySlug);
// Alternates light and dark artwork in every column count (3, 2 and 1).
const workbenchProjects = ['ikinuki-trip-agency', 'propiedades-allende', 'afh-logistics', 'tk-industrial', 'el-sotano-comico', 'nutriologa-allende', 'wolf-fitness'].map(bySlug);
const pad = (number: number) => String(number).padStart(2, '0');


function Asterisk({ className = '' }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    {[0, 45, 90, 135].map((angle) => <path key={angle} d="M50 5V95" stroke="currentColor" strokeWidth="15" transform={`rotate(${angle} 50 50)`} />)}
  </svg>;
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
  const [contactInquiry, setContactInquiry] = useState<ContactInquiry | null>(null);
  return <div className="studio" id="top">
    <a className="studio-skip" href="#main">Skip to content</a>
    <header className="studio-nav studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span><PhAsterisk aria-hidden="true" className="ph-icon" /></span></a><span className="studio-nav-note">Independent developer<br />Monterrey, México</span><nav aria-label="Main navigation"><a href="#work">Work <span>{pad(workbenchProjects.length)}</span></a><a href="#playground">Playground</a><a href="#about">About</a><a href="#services">Services</a><a className="studio-nav-contact" href="#contact">Let’s talk <PhArrowUpRight aria-hidden="true" className="ph-icon" /></a></nav></header>
    <main id="main">
      <section className="studio-hero studio-wrap" aria-labelledby="studio-name" onPointerMove={event => { if (event.pointerType === 'touch') return; const aura = event.currentTarget.querySelector<HTMLElement>('.hl-aura'); if (!aura) return; const r = aura.getBoundingClientRect(); aura.style.setProperty('--spot-x', `${event.clientX - r.left}px`); aura.style.setProperty('--spot-y', `${event.clientY - r.top}px`); }}>
        <div className="hl-aura" aria-hidden="true"><i className="hl-blob hl-blob-a" /><i className="hl-blob hl-blob-b" /></div>
        <div className="studio-hero-meta"><span className="studio-kicker">A personal corner of the internet</span><span className="studio-available"><i /> Available for freelance & remote</span></div>
        <h1 id="studio-name" aria-label="Jose Sanchez"><b className="studio-name-text" aria-hidden="true">{'JOSE SANCHEZ'.split('').map((ch, i) => <span key={i} className="hl-letter" style={{ '--i': i } as CSSProperties}>{ch === ' ' ? ' ' : ch}</span>)}</b></h1>
        <div className="studio-hero-bottom">
          <div className="studio-hero-intro">
            <div className="studio-hero-statement">Useful websites.<br />A little <em>unexpected.<svg className="hl-scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 13 C 45 5, 85 17, 125 9 S 180 6, 197 11" /></svg></em><Asterisk className="studio-hero-star" /></div>
            <p>I make websites for busy people who need an online presence, without the hassles.</p>
            <div className="studio-hero-actions">
              <a className="studio-pill" href="#work">Explore my work <Asterisk className="studio-button-star" /></a>
              <a className="studio-pill" href="#contact">Let’s talk</a>
              <a className="studio-learning-link" href="#services">See pricing</a>
            </div>
            <div className="studio-hero-footnote"><span>Design-minded.<br />Detail-obsessed.</span><span className="studio-handnote">Always a work in progress.</span></div>
          </div>
          <IsoCity facades={deckLeads.map(project => project.screenshot).filter((src): src is string => Boolean(src))} />
        </div>
        <div className="studio-hero-baseline"><span>LOCAL TIME {time} / MX</span><span>Scroll a little. Find something good. ↓</span><span>SELECTED WORK & EXPERIMENTS</span></div>
      </section>
      <SelectedWork />
      <ServicesSection onInquiry={tier => setContactInquiry({ tier })} />
      <section className="studio-hub studio-wrap" id="about" aria-labelledby="about-title">
        <div className="hub-head">
          <div className="hub-title"><span className="studio-kicker hub-kicker"><b>03</b> / Behind the browser</span><h2 id="about-title">A person who likes<br /><em>figuring things out.</em><Asterisk className="hub-star" /></h2></div>
          <div className="hub-intro"><p>I’m Jose. I build interfaces for businesses with very different worlds: comedy, real estate, logistics, fitness, and more. I’m interested in the details that make each one feel like itself.</p><p className="hub-tools"><span>Currently building with</span> React / TypeScript / CSS / Vite</p></div>
          <div className="hub-cube"><RubiksCube /></div>
        </div>
        <div className="hub-grid">
          <div className="hub-card hub-pet">
            <div className="hub-card-head"><span><PhUser aria-hidden="true" className="ph-icon" /> Personal corner</span><span>01 / 04</span></div>
            <DigimonPetCard />
          </div>
          <div className="hub-card hub-lab">
            <div className="hub-card-head"><span><PhCode aria-hidden="true" className="ph-icon" /> Learning lab</span><span>02 / 04</span></div>
            <p className="hub-card-sub">Client work keeps me building. Curiosity keeps me learning.</p>
            <LearningSection embedded />
          </div>
        </div>
        <div className="hub-arcade"><SpaceArcade openRequest={arcadeRequest} /></div>
        <div className="hub-sandbox"><SandboxSection embedded onArcade={() => setArcadeRequest(value => value + 1)} /></div>
      </section>
      <section className="studio-playground" id="playground" aria-labelledby="playground-title">
        <div className="studio-wrap">
          <div className="studio-section-heading"><div><h2 id="playground-title">Curiosity,<br /><em>with a browser.</em></h2></div><p>One composition. Four ways to play.<br />A little piece of Monterrey, made yours.</p></div>
          <CompositionPlayground />
        </div>
      </section>
      <ContactSection inquiry={contactInquiry} onSend={sendMessage} />
    </main><MountainSignature /><footer className="studio-footer studio-wrap"><a href="#top" className="studio-logo" aria-label="Jose Sanchez home">js<span><PhAsterisk aria-hidden="true" className="ph-icon" /></span></a><span>Jose Sanchez © {new Date().getFullYear()}</span><a href="#top">Back to the top ↑</a></footer>
  </div>;
}
