import { ArrowUpRight as PhArrowUpRight, ArrowsLeftRight as PhArrowsLeftRight, ArrowLeft as PhArrowLeft, ArrowRight as PhArrowRight } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ProjectAnnotations } from './ProjectAnnotations.tsx';
import { ProjectTransformation } from './ProjectTransformation.tsx';
import { afhNotes } from '../data/projectNotes.ts';
import type { projects as allProjects } from '../data/projects.ts';
import type { DesignNote } from './ProjectAnnotations.tsx';

export type Project = (typeof allProjects)[number];
/** A project with a published site, as the notes and comparison panels expect. */
export type LiveProject = Project & { url: string; screenshot: string };
interface Panel { slug: string; view: 'notes' | 'compare' }

const designNotes: Partial<Record<string, DesignNote[]>> = { 'afh-logistics': afhNotes };

function BrowserBar({ domain }: { domain: string }) {
  return <span className="workbench-browser-bar"><span><span className="win-dots" aria-hidden="true"><i /><i /><i /></span></span><span>{domain}</span></span>;
}

function ProjectArtwork({ project }: { project: Project }) {
  switch (project.theme) {
    case 'warm':
      return <><span className="workbench-art-label">Nutrición / Allende, N.L.</span><span className="workbench-art-title">A little<br />more <em>balance.</em></span><svg className="workbench-leaf" viewBox="0 0 160 180" fill="none"><path d="M35 174C46 121 100 85 124 15M65 115C10 112 12 59 14 45C59 50 85 78 65 115ZM92 80C76 40 96 13 143 8C146 44 129 76 92 80Z" stroke="currentColor" strokeWidth="2" /></svg><span className="workbench-art-bottom">Cuidado que se siente.</span></>;
    case 'steel':
      return <><span className="workbench-art-label">TK Industrial / Manufacturing</span><span className="workbench-drawing"><i /><i /><i /><b>+</b></span><span className="workbench-art-title">Precision.<br /><em>At every scale.</em></span><span className="workbench-art-bottom">Procesos / Capacidades / Cotización</span></>;
    case 'brutal':
      return <><span className="workbench-art-label">Wolf Fitness / Monterrey</span><span className="workbench-slashes"><i /><i /><i /></span><span className="workbench-art-title">BUILT<br />FOR<br /><em>MORE.</em></span><span className="workbench-art-bottom">Entrena como lobo. <PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></>;
    case 'punch':
      return <><span className="workbench-art-label">Smashouse / Allende, N.L.</span><span className="workbench-art-title">SMALL PLACE.<br /><em>BIG SMASH.</em></span><span className="workbench-burger"><i /><i /><i /><i /><i /></span><span className="workbench-art-bottom">Costra crujiente. Cero timidez.</span></>;
    case 'entertainment':
      return <><span className="workbench-art-label">El Sótano / Comedia</span><span className="workbench-comedy-artwork"><img src="/screenshots/elsotanocomico-welcome.jpg" alt="" width="1320" height="620" loading="lazy" decoding="async" /></span><span className="workbench-art-bottom">Clips / Humor / Cultura pop</span></>;
    case 'estate':
      return <><span className="workbench-art-label">Propiedades Allende / Allende, N.L.</span><span className="workbench-art-title">A little more<br /><em>room to imagine.</em></span><span className="workbench-estate-photo"><img src="/artwork/allende-property.webp" alt="" width="1000" height="525" loading="lazy" decoding="async" /></span><span className="workbench-browser workbench-estate-browser"><BrowserBar domain="propiedadesallende.com" /><img src={project.screenshot ?? undefined} alt="" width="1400" height="1225" loading="lazy" decoding="async" /></span></>;
    case 'enterprise':
      return <><span className="workbench-art-label">AFH Logistics / Monterrey</span><span className="workbench-art-title">Built to keep moving<span>.</span></span><svg className="workbench-route-map" viewBox="0 0 640 440" fill="none"><path d="M-20 310 100 250 175 280 265 165 390 195 480 65 660 90M30 460 170 325 255 355 370 265 440 300 570 180 660 200" stroke="currentColor" strokeOpacity=".18" /><path d="M70 350 175 280 265 165 390 195 480 65 580 78" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" /></svg><span className="workbench-browser workbench-afh-browser"><BrowserBar domain="afh.mx" /><img src={project.screenshot ?? undefined} alt="" width="1400" height="1225" loading="lazy" decoding="async" /></span><span className="workbench-afh-phone"><img src="/screenshots/afh-mobile.jpg" alt="" width="390" height="844" loading="lazy" decoding="async" /></span><span className="workbench-art-bottom">25.6866° N / 100.3161° W</span></>;
    case 'travel':
      return <><span className="workbench-travel-hero"><img src={project.screenshot ?? undefined} alt="" width="1440" height="1000" loading="lazy" decoding="async" /></span><span className="workbench-art-label">Ikinuki Trip Agency / Japón</span><span className="workbench-art-bottom">Kioto / Tokio / Viajes de lujo</span></>;
    default:
      return null;
  }
}

function statusLabel(project: Project) {
  if (project.status !== 'live') return 'Client study · In progress';
  return project.independent ? 'Live · Independent project' : 'Live website';
}

export function Workbench({ projects, children }: { projects: Project[]; children: ReactNode }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [active, setActive] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const swipe = useRef<number | null>(null);
  const panelProject = panel && projects.find(project => project.slug === panel.slug);
  const count = projects.length;
  const current = projects[active];
  const pad = (n: number) => String(n).padStart(2, '0');

  function go(index: number) {
    setActive((index + count) % count);
    setDetailsOpen(false);
  }

  function closePanel() {
    // Only reachable from an open panel.
    const trigger = triggers.current[`${panel!.slug}-${panel!.view}`];
    setPanel(null);
    trigger?.focus({ preventScroll: true });
    trigger?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  const live = current.status === 'live';
  const notes = designNotes[current.slug];

  return <div className="studio-workbench wbc" id="workbench">
    <div className="wbc-layout">
      <div className="workbench-intro wbc-intro">{children}</div>
      <div
        className="wbc-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Selected work"
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1); }
        }}
        onPointerDown={event => { swipe.current = event.clientX; }}
        onPointerUp={event => {
          if (swipe.current === null) return;
          const dx = event.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="wbc-track">
          {projects.map((project, index) => {
            let offset = index - active;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;
            const isActive = offset === 0;
            const projectLive = project.status === 'live';
            return <div className={`wbc-slot${isActive ? ' is-active' : ''}`} key={project.id} style={{ '--o': offset, '--s': Math.sign(offset), '--abs': Math.abs(offset) } as CSSProperties}>
              <article
                className={`wbc-card workbench-${project.theme}${projectLive ? ' is-live' : ''}`}
                id={project.id}
                aria-roledescription="slide"
                aria-label={`${pad(index + 1)} of ${pad(count)}: ${project.name}`}
                inert={!isActive ? '' : undefined}
              >
                <header className="wbc-head">
                  <span className="wbc-kicker">{project.name} / {project.category}</span>
                  <span className={`wbc-badge ${projectLive ? 'is-live' : 'is-progress'}`}><i aria-hidden="true" />{projectLive ? 'Live' : 'In progress'}</span>
                </header>
                <span className="wbc-preview workbench-art" aria-hidden="true"><ProjectArtwork project={project} /></span>
                <h3 className="wbc-title"><span className="wbc-number">{pad(index + 1)}</span><span>{project.name}</span></h3>
                <p className="wbc-category">{project.category}</p>
                <footer className="wbc-foot">
                  <button type="button" className="wbc-details-toggle" aria-expanded={isActive && detailsOpen} aria-controls="wbc-details" onClick={() => setDetailsOpen(open => !open)}>
                    {projectLive ? 'Project details' : 'Explore study'} <b aria-hidden="true">{isActive && detailsOpen ? '−' : '+'}</b>
                  </button>
                  {projectLive
                    ? <a className="wbc-visit" href={project.url ?? undefined} target="_blank" rel="noreferrer" aria-label={`Visit website: ${project.name} (opens in a new tab)`}>Visit website <PhArrowUpRight aria-hidden="true" className="ph-icon" /></a>
                    : <span className="wbc-soon">{statusLabel(project)}</span>}
                </footer>
              </article>
              {!isActive && <button type="button" className="wbc-pick" tabIndex={-1} aria-label={`Show ${project.name}`} onClick={() => go(index)} />}
            </div>;
          })}
        </div>
        <div className="wbc-controls">
          <button type="button" className="wbc-arrow" aria-label="Previous project" onClick={() => go(active - 1)}><PhArrowLeft aria-hidden="true" className="ph-icon" /></button>
          <span className="wbc-count" aria-live="polite">{pad(active + 1)} / {pad(count)}</span>
          <button type="button" className="wbc-arrow wbc-arrow-next" aria-label="Next project" onClick={() => go(active + 1)}><PhArrowRight aria-hidden="true" className="ph-icon" /></button>
        </div>
        <div className="wbc-dots" role="group" aria-label="Choose a project">
          {projects.map((project, index) => <button key={project.id} type="button" className={index === active ? 'is-active' : ''} aria-label={project.name} aria-current={index === active} onClick={() => go(index)} />)}
        </div>
        {detailsOpen && <div className="wbc-details" id="wbc-details">
          <p>{current.blurb}</p>
          <ul aria-label="Project features">{current.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          {notes && <div className="workbench-closer" role="group" aria-label={`A closer look at ${current.name}`}>
            <button ref={node => { triggers.current[`${current.slug}-notes`] = node; }} type="button" aria-expanded={panel?.slug === current.slug && panel.view === 'notes'} aria-controls={`${current.id}-under-the-hood`} onClick={() => setPanel(panel?.view === 'notes' ? null : { slug: current.slug, view: 'notes' })}>Design notes <span>{pad(notes.length)}</span></button>
            <button ref={node => { triggers.current[`${current.slug}-compare`] = node; }} type="button" aria-expanded={panel?.slug === current.slug && panel.view === 'compare'} aria-controls="transformation" onClick={() => setPanel(panel?.view === 'compare' ? null : { slug: current.slug, view: 'compare' })}>Wireframe comparison <span aria-hidden="true"><PhArrowsLeftRight aria-hidden="true" className="ph-icon" /></span></button>
          </div>}
          {!live && <p className="wbc-details-note">{statusLabel(current)}</p>}
        </div>}
      </div>
    </div>
    {/* Panels open only from a project's notes buttons, which exist only for live projects with design notes. */}
    {panel?.view === 'notes' && <ProjectAnnotations project={panelProject as LiveProject} notes={designNotes[panel.slug]!} onClose={closePanel} />}
    {panel?.view === 'compare' && <ProjectTransformation project={panelProject as LiveProject} onClose={closePanel} />}
  </div>;
}
