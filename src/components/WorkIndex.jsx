import { useState } from 'react';
import { useInView } from '../hooks/useInView.js';

export function WorkIndex({ projects }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const [hoveredId, setHoveredId] = useState(null);
  const hovered = projects.find((p) => p.id === hoveredId);

  return (
    <section className="work-index" id="work" ref={ref}>
      <div
        className={`work-index-backdrop ${hovered ? 'active' : ''}`}
        style={
          hovered
            ? {
                backgroundImage: hovered.screenshot ? `url(${hovered.screenshot})` : undefined,
                backgroundColor: hovered.mock ? hovered.mock.bg : hovered.accent,
              }
            : undefined
        }
      />
      <div className={`work-index-head ${inView ? 'in' : ''}`}>
        <span className="eyebrow">Selected Work</span>
        <h2>{String(projects.length).padStart(2, '0')} real client projects</h2>
      </div>
      <ul className={`work-index-list ${inView ? 'in' : ''}`}>
        {projects.map((p) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              style={{ '--case': p.accent }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(p.id)}
              onBlur={() => setHoveredId(null)}
            >
              <span className="work-index-list-num">{p.num}</span>
              <span className="work-index-list-name">{p.name}</span>
              <span className="work-index-list-cat">{p.category}</span>
              <span className={`work-index-status ${p.status === 'live' ? 'is-live' : 'is-soon'}`}>
                <span className="dot" />
                {p.status === 'live' ? p.url.replace('https://', '') : 'Soon'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
