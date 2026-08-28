import { useRef, useState } from 'react';
import { useInView } from '../hooks/useInView.js';
import { projects } from '../data/projects.js';

const TOTAL = String(projects.length).padStart(2, '0');

const isFinePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export function ProjectSection({ project, index }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const mediaRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false });
  const alt = index % 2 === 1;

  function handleMouseMove(e) {
    const node = mediaRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    if (isFinePointer) {
      const px = (relX / rect.width - 0.5) * 2;
      const py = (relY / rect.height - 0.5) * 2;
      setTilt({ x: px * -6, y: py * -6 });
      setCursor({ x: relX, y: relY, show: true });
    }
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setCursor((c) => ({ ...c, show: false }));
  }

  const isLive = project.status === 'live';
  const cursorLabel = isLive ? 'VIEW PROJECT →' : 'BUILT FOR CLIENT';

  return (
    <section
      id={project.id}
      ref={ref}
      className={`project theme-${project.theme} ${alt ? 'project--alt' : ''} ${inView ? 'in' : ''}`}
      style={{ '--case': project.accent, '--case2': project.accent2 }}
    >
      <div className="project-inner">
        <div className="project-media-col">
          <div
            className="project-media"
            ref={mediaRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
          >
            {project.screenshot ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="project-media-link"
              >
                <img src={project.screenshot} alt={`${project.name} — live site screenshot`} loading="lazy" />
              </a>
            ) : (
              <MockBrowser project={project} />
            )}
            <SignatureMoment project={project} />
            {isFinePointer && (
              <span
                className="cursor-label"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  opacity: cursor.show ? 1 : 0,
                }}
              >
                {cursorLabel}
              </span>
            )}
          </div>
        </div>

        <div className="project-text-col">
          <div className="project-head">
            <span className="project-num">{project.num} / {TOTAL}</span>
            <span className={`project-status ${isLive ? 'is-live' : 'is-soon'}`}>
              <span className="dot" />
              {isLive ? (
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.url.replace('https://', '')} ↗
                </a>
              ) : (
                'Built for client — launching soon'
              )}
            </span>
          </div>

          <p className="project-category">{project.category}</p>
          <h3 className="project-name">
            {project.name}
            {project.sub && <span className="project-sub"> {project.sub}</span>}
          </h3>
          <p className="project-blurb">{project.blurb}</p>

          <div className="project-tags">
            {project.tags.map((t) => (
              <span key={t} className="tag-chip">
                {t}
              </span>
            ))}
          </div>

          {isLive ? (
            <a className="explore-link" href={project.url} target="_blank" rel="noopener noreferrer">
              Explore project <span aria-hidden="true">→</span>
            </a>
          ) : (
            <a className="explore-link" href="mailto:devilfruitd3v@proton.me">
              Want one like this <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function SignatureMoment({ project }) {
  switch (project.theme) {
    case 'warm':
      return (
        <svg className="sig-vine" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M -10 260 C 60 260 40 190 100 190 C 160 190 150 130 90 110 C 40 94 60 40 130 30 C 200 20 220 70 280 55 C 340 42 350 -10 410 -10" />
        </svg>
      );
    case 'steel':
      return (
        <div className="sig-stamp" aria-hidden="true">
          <span className="sig-press" />
          <span className="sig-dent" />
        </div>
      );
    case 'punch':
      return (
        <div className="sig-burger" aria-hidden="true">
          <span className="sig-layer sig-layer-bun-top" />
          <span className="sig-layer sig-layer-lettuce" />
          <span className="sig-layer sig-layer-cheese" />
          <span className="sig-layer sig-layer-patty" />
          <span className="sig-layer sig-layer-bun-bottom" />
        </div>
      );
    case 'entertainment':
      return (
        <div className="sig-shatter" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="sig-tile"
              style={{
                backgroundImage: `url(${project.screenshot})`,
                backgroundPosition: `${((i % 4) / 3) * 100}% ${(Math.floor(i / 4) / 2) * 100}%`,
              }}
            />
          ))}
        </div>
      );
    case 'enterprise':
      return (
        <svg className="sig-route" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M -10 45 C 80 45 90 15 160 15 C 230 15 240 45 320 45 C 370 45 380 25 410 25" />
          <circle r="4" className="sig-route-dot">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M -10 45 C 80 45 90 15 160 15 C 230 15 240 45 320 45 C 370 45 380 25 410 25" />
          </circle>
        </svg>
      );
    default:
      return null;
  }
}

function MockBrowser({ project }) {
  const m = project.mock;
  return (
    <div className="mock-browser" style={{ background: m.bg, color: m.fg }}>
      <div className="mock-chrome">
        <span className="mock-dot" />
        <span className="mock-dot" />
        <span className="mock-dot" />
      </div>
      <div className="mock-body">
        <span className="mock-eyebrow">{m.eyebrow}</span>
        <p className="mock-h">{m.heading}</p>
        <p className="mock-sub">{m.sub2}</p>
        <span className="mock-btn" style={{ background: m.btnColor, color: m.bg }}>
          {m.btn}
        </span>
      </div>
    </div>
  );
}
