import { useEffect, useRef, useState } from 'react';

export function ProjectAnnotations({ project, notes, onClose }) {
  const [selected, setSelected] = useState(0);
  const heading = useRef(null);
  const active = notes[selected];
  const panelId = `${project.id}-design-note`;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest('section').scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, []);

  return (
    <section
      className="studio-case-study"
      id={`${project.id}-under-the-hood`}
      aria-labelledby={`${project.id}-notes-title`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="studio-case-topline">
        <span className="studio-kicker">A closer look / {project.name}</span>
        <button type="button" className="studio-case-close" onClick={onClose}>Close notes <span aria-hidden="true">×</span></button>
      </div>
      <div className="studio-case-heading">
        <h4 id={`${project.id}-notes-title`} ref={heading} tabIndex={-1}>Small choices.<br /><em>Clearer next steps.</em></h4>
        <p>Three details from the homepage.<br />Select a number to look closer.</p>
      </div>
      <div className="studio-case-layout">
        <div className="studio-case-visual">
          <div className="studio-case-browser"><span aria-hidden="true">● ● ●</span><span>{project.url.replace('https://', '')} / homepage</span><span aria-hidden="true">↗</span></div>
          <div className="studio-case-canvas">
            <div className="studio-case-image">
              <img src={project.screenshot} alt={`${project.name} homepage showing its service headline, reassurance cards, and contact actions`} width="1400" height="1225" />
              <div className="studio-case-grid" aria-hidden="true" />
              <div className="studio-case-highlight" aria-hidden="true" style={{ left: `${active.area.left}%`, top: `${active.area.top}%`, width: `${active.area.width}%`, height: `${active.area.height}%` }} />
            </div>
            <div className="studio-case-pins" role="group" aria-label="Explore homepage annotations">
              {notes.map((note, index) => (
                <button
                  key={note.id}
                  type="button"
                  className="studio-case-pin"
                  style={{ '--pin-x': `${note.pin.left}%`, '--pin-y': `${note.pin.top}%` }}
                  aria-label={`Note ${note.number}: ${note.title}`}
                  aria-pressed={selected === index}
                  aria-controls={panelId}
                  onClick={() => setSelected(index)}
                >{note.number}</button>
              ))}
            </div>
          </div>
          <div className="studio-case-visual-caption"><span>Interface notes</span><span>{active.number} / {String(notes.length).padStart(2, '0')}</span></div>
        </div>
        <div className="studio-case-notes">
          <div className="studio-case-note-options" role="group" aria-label="Design decisions">
            {notes.map((note, index) => (
              <button key={note.id} type="button" aria-pressed={selected === index} aria-controls={panelId} onClick={() => setSelected(index)}>
                <span>{note.number}</span><span>{note.category}</span><span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="studio-case-note" id={panelId} aria-live="polite" aria-atomic="true">
            <span className="studio-kicker">{active.category} / {active.number}</span>
            <h5>{active.title}</h5>
            <p>{active.body}</p>
            <div className="studio-case-takeaway"><span aria-hidden="true">↳</span><p>{active.takeaway}</p></div>
          </div>
        </div>
      </div>
      <div className="studio-case-footer"><span>Good interfaces are a collection of small decisions.</span><a href={project.url} target="_blank" rel="noreferrer">Explore the live website ↗</a></div>
    </section>
  );
}
