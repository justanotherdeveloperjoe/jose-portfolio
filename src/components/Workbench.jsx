function ProjectArtwork({ theme }) {
  switch (theme) {
    case 'warm':
      return <><span className="workbench-art-label">Nutrición / Allende, N.L.</span><span className="workbench-art-title">A little<br />more <em>balance.</em></span><svg className="workbench-leaf" viewBox="0 0 160 180" fill="none"><path d="M35 174C46 121 100 85 124 15M65 115C10 112 12 59 14 45C59 50 85 78 65 115ZM92 80C76 40 96 13 143 8C146 44 129 76 92 80Z" stroke="currentColor" strokeWidth="2" /></svg><span className="workbench-art-bottom">Cuidado que se siente.</span></>;
    case 'steel':
      return <><span className="workbench-art-label">TK Industrial / Manufacturing</span><span className="workbench-drawing"><i /><i /><i /><b>+</b></span><span className="workbench-art-title">Precision.<br /><em>At every scale.</em></span><span className="workbench-art-bottom">Catálogo / Capacidades / Cotización</span></>;
    case 'brutal':
      return <><span className="workbench-art-label">Wolf Fitness / Monterrey</span><span className="workbench-slashes"><i /><i /><i /></span><span className="workbench-art-title">BUILT<br />FOR<br /><em>MORE.</em></span><span className="workbench-art-bottom">Entrena como lobo. ↗</span></>;
    case 'punch':
      return <><span className="workbench-art-label">Smashouse / Allende, N.L.</span><span className="workbench-art-title">SMALL PLACE.<br /><em>BIG SMASH.</em></span><span className="workbench-burger"><i /><i /><i /><i /><i /></span><span className="workbench-art-bottom">Costra crujiente. Cero timidez.</span></>;
    default:
      return null;
  }
}

export function Workbench({ projects }) {
  return <section className="studio-workbench" id="workbench" aria-labelledby="workbench-title">
    <div className="workbench-heading"><div><span className="studio-kicker">The next chapter</span><h3 id="workbench-title">On the <em>workbench.</em></h3></div><p>More businesses. Different personalities.<br /><span>Built for clients · Launching soon</span></p></div>
    <div className="workbench-grid" style={{ '--workbench-columns': Math.min(4, projects.length) }}>
      {projects.map((project, index) => <details className={`workbench-card workbench-${project.theme}`} key={project.id} id={project.id}>
        <summary>
          <span className="workbench-art" aria-hidden="true"><ProjectArtwork theme={project.theme} /><span className="workbench-study-label">Project study / 0{index + 4}</span></span>
          <span className="workbench-card-heading"><span className="workbench-number">0{index + 4}</span><span>{project.name}</span></span>
          <span className="workbench-card-meta"><span>{project.category}</span><span className="workbench-expand"><span className="workbench-closed-label">Explore study</span><span className="workbench-open-label">Close study</span><b aria-hidden="true">+</b></span></span>
        </summary>
        <div className="workbench-details"><p>{project.blurb}</p><ul aria-label="Project features">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><span className="workbench-status"><i aria-hidden="true" /> Built for client · Launching soon</span></div>
      </details>)}
    </div>
  </section>;
}
