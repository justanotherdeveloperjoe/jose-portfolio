import { useEffect, useRef, useState } from 'react';
import { useActiveSection } from '../hooks/useActiveSection.js';

const PAD_Y = 8;
const PAD_X = 12;

export function StickyNav({ projects }) {
  const ids = projects.map((p) => p.id);
  const activeId = useActiveSection(ids);
  const activeIndex = ids.indexOf(activeId);
  const activeProject = projects[activeIndex] || projects[0];

  const navRef = useRef(null);
  const olRef = useRef(null);
  const itemRefs = useRef([]);
  const [frame, setFrame] = useState(null);
  const [navTop, setNavTop] = useState(40);

  useEffect(() => {
    const MARGIN = 40;
    let ticking = false;

    function update() {
      ticking = false;
      const nav = navRef.current;
      const container = nav?.parentElement;
      if (!nav || !container) return;

      const containerRect = container.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const navH = nav.offsetHeight;

      const travel = Math.max(containerRect.height - viewportH, 1);
      const progress = Math.min(Math.max(-containerRect.top / travel, 0), 1);

      const minTop = MARGIN;
      const maxTop = Math.max(viewportH - navH - MARGIN, MARGIN);
      setNavTop(minTop + progress * (maxTop - minTop));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    function measure() {
      const ol = olRef.current;
      const item = itemRefs.current[activeIndex];
      if (!ol || !item) return;
      const olRect = ol.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      setFrame({
        top: itemRect.top - olRect.top - PAD_Y,
        left: itemRect.left - olRect.left - PAD_X,
        width: itemRect.width + PAD_X * 2,
        height: itemRect.height + PAD_Y * 2,
      });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <nav className="sticky-nav" aria-label="Project navigator" ref={navRef} style={{ top: navTop }}>
      <ol ref={olRef}>
        {frame && (
          <span
            className="sticky-nav-frame"
            style={{
              transform: `translate(${frame.left}px, ${frame.top}px)`,
              width: frame.width,
              height: frame.height,
              borderColor: activeProject.accent,
            }}
            aria-hidden="true"
          />
        )}
        {projects.map((p, i) => (
          <li key={p.id} className={p.id === activeId ? 'active' : ''} ref={(el) => (itemRefs.current[i] = el)}>
            <a href={`#${p.id}`} style={{ '--case': p.accent }}>
              <span className="sticky-nav-num">{p.num}</span>
              <span className="sticky-nav-name">{p.name}</span>
            </a>
          </li>
        ))}
      </ol>
      <div className="sticky-nav-progress">
        <span className="sticky-nav-progress-num">01</span>
        <div className="sticky-nav-track">
          <div
            className="sticky-nav-fill"
            style={{ height: `${((activeIndex + 1) / ids.length) * 100}%` }}
          />
        </div>
        <span className="sticky-nav-progress-num">{String(ids.length).padStart(2, '0')}</span>
      </div>
    </nav>
  );
}
