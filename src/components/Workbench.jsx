import { ArrowUpRight as PhArrowUpRight, ArrowsLeftRight as PhArrowsLeftRight } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { ProjectAnnotations } from './ProjectAnnotations.jsx';
import { ProjectTransformation } from './ProjectTransformation.jsx';
import { afhNotes } from '../data/projectNotes.js';

const designNotes = { 'afh-logistics': afhNotes };

function BrowserBar({ domain }) {
  return <span className="workbench-browser-bar"><span><span className="win-dots" aria-hidden="true"><i /><i /><i /></span></span><span>{domain}</span></span>;
}

function ProjectArtwork({ project }) {
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
      return <><span className="workbench-art-label">Propiedades Allende / Allende, N.L.</span><span className="workbench-art-title">A little more<br /><em>room to imagine.</em></span><span className="workbench-estate-photo"><img src="/artwork/allende-property.webp" alt="" width="1000" height="525" loading="lazy" decoding="async" /></span><span className="workbench-browser workbench-estate-browser"><BrowserBar domain="propiedadesallende.com" /><img src={project.screenshot} alt="" width="1400" height="1225" loading="lazy" decoding="async" /></span></>;
    case 'enterprise':
      return <><span className="workbench-art-label">AFH Logistics / Monterrey</span><span className="workbench-art-title">Built to keep moving<span>.</span></span><svg className="workbench-route-map" viewBox="0 0 640 440" fill="none"><path d="M-20 310 100 250 175 280 265 165 390 195 480 65 660 90M30 460 170 325 255 355 370 265 440 300 570 180 660 200" stroke="currentColor" strokeOpacity=".18" /><path d="M70 350 175 280 265 165 390 195 480 65 580 78" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" /></svg><span className="workbench-browser workbench-afh-browser"><BrowserBar domain="afh.mx" /><img src={project.screenshot} alt="" width="1400" height="1225" loading="lazy" decoding="async" /></span><span className="workbench-afh-phone"><img src="/screenshots/afh-mobile.jpg" alt="" width="390" height="844" loading="lazy" decoding="async" /></span><span className="workbench-art-bottom">25.6866° N / 100.3161° W</span></>;
    case 'travel':
      return <><span className="workbench-travel-hero"><img src={project.screenshot} alt="" width="1440" height="1000" loading="lazy" decoding="async" /></span><span className="workbench-art-label">Ikinuki Trip Agency / Japón</span><span className="workbench-art-bottom">Kioto / Tokio / Viajes de lujo</span></>;
    default:
      return null;
  }
}

function statusLabel(project) {
  if (project.status !== 'live') return 'Client study · In progress';
  return project.independent ? 'Live · Independent project' : 'Live website';
}

export function Workbench({ projects, children }) {
  const [panel, setPanel] = useState(null);
  const triggers = useRef({});
  const panelProject = panel && projects.find(project => project.slug === panel.slug);

  function closePanel() {
    const trigger = triggers.current[`${panel.slug}-${panel.view}`];
    setPanel(null);
    const target = trigger?.checkVisibility?.() ? trigger : trigger?.closest('.workbench-card').querySelector('summary');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  return <div className="studio-workbench" id="workbench">
    <div className="workbench-grid">
      <div className="workbench-intro">{children}</div>
      {projects.map((project, index) => {
        const live = project.status === 'live';
        const notes = designNotes[project.slug];
        return <article className={`workbench-card workbench-${project.theme}${live ? ' is-live' : ''}`} key={project.id} id={project.id}>
          <details>
            <summary>
              <span className="workbench-art" aria-hidden="true"><ProjectArtwork project={project} /></span>
              <h3 className="workbench-card-heading"><span className="workbench-number">{String(index + 1).padStart(2, '0')}</span><span>{project.name}</span></h3>
              <span className="workbench-card-meta"><span>{project.category}</span><span className="workbench-expand"><span className="workbench-closed-label">{live ? 'Project details' : 'Explore study'}</span><span className="workbench-open-label">{live ? 'Close details' : 'Close study'}</span><b aria-hidden="true">+</b></span></span>
            </summary>
            <div className="workbench-details">
              <p>{project.blurb}</p>
              <ul aria-label="Project features">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
              {notes && <div className="workbench-closer" role="group" aria-label={`A closer look at ${project.name}`}>
                <button ref={node => { triggers.current[`${project.slug}-notes`] = node; }} type="button" aria-expanded={panel?.slug === project.slug && panel.view === 'notes'} aria-controls={`${project.id}-under-the-hood`} onClick={() => setPanel(panel?.view === 'notes' ? null : { slug: project.slug, view: 'notes' })}>Design notes <span>{String(notes.length).padStart(2, '0')}</span></button>
                <button ref={node => { triggers.current[`${project.slug}-compare`] = node; }} type="button" aria-expanded={panel?.slug === project.slug && panel.view === 'compare'} aria-controls="transformation" onClick={() => setPanel(panel?.view === 'compare' ? null : { slug: project.slug, view: 'compare' })}>Wireframe comparison <span aria-hidden="true"><PhArrowsLeftRight aria-hidden="true" className="ph-icon" /></span></button>
              </div>}
            </div>
          </details>
          <div className="workbench-card-foot">
            <span className={`workbench-status ${live ? 'is-live' : 'is-progress'}`}><i aria-hidden="true" />{statusLabel(project)}</span>
            {live && <a className="workbench-visit" href={project.url} target="_blank" rel="noreferrer" aria-label={`Visit website: ${project.name} (opens in a new tab)`}>Visit website <span aria-hidden="true"><PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></a>}
          </div>
        </article>;
      })}
    </div>
    {panel?.view === 'notes' && <ProjectAnnotations project={panelProject} notes={designNotes[panel.slug]} onClose={closePanel} />}
    {panel?.view === 'compare' && <ProjectTransformation project={panelProject} onClose={closePanel} />}
  </div>;
}
