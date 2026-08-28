import { useActiveSection } from '../hooks/useActiveSection.js';

export function CornerFrame({ projects, visible }) {
  const ids = projects.map((p) => p.id);
  const activeId = useActiveSection(ids);
  const active = projects.find((p) => p.id === activeId) || projects[0];

  return (
    <div className={`corner-frame ${visible ? 'visible' : ''}`} aria-hidden="true">
      <div className="corner-frame-tl">
        <span>JVS&reg;</span>
        <span>FRONT-END DEV</span>
      </div>
      <div className="corner-frame-tr">
        <span>JVS://WORK/{active.slug?.toUpperCase()}</span>
        <span>{active.num} / {String(projects.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
