import { useInView } from '../hooks/useInView.js';
import { useLocalClock } from '../hooks/useLocalClock.js';
import { Magnetic } from './Magnetic.jsx';
import { projects } from '../data/projects.js';

const SITE_COUNT = projects.length;
const INDUSTRY_COUNT = new Set(projects.map((p) => p.category)).size;

export function Hero() {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const time = useLocalClock();

  return (
    <header className="hero" ref={ref}>
      <svg className="compass" viewBox="0 0 320 320" aria-hidden="true">
        <circle cx="160" cy="160" r="140" />
        <circle cx="160" cy="160" r="90" />
        <line x1="160" y1="10" x2="160" y2="45" />
        <line x1="160" y1="275" x2="160" y2="310" />
        <line x1="10" y1="160" x2="45" y2="160" />
        <line x1="275" y1="160" x2="310" y2="160" />
      </svg>

      <div className={`hero-top hero-anim ${inView ? 'in' : ''}`}>
        <span className="wordmark">JOSE SANCHEZ</span>
        <span className="availability">
          <span className="dot-live" />
          Available for freelance / remote
        </span>
      </div>

      <div className="hero-headline">
        <h1 className={`title-mega hero-anim delay-1 ${inView ? 'in' : ''}`}>
          FRONT&#8209;END
          <br />
          DEVELOPER
        </h1>
      </div>

      <div className={`hero-below hero-anim delay-2 ${inView ? 'in' : ''}`}>
        <p className="lede">
          Building fast, responsive interfaces for real businesses — from first pixel to
          launch-ready, across nutrition, industrial, fitness, food, media, real estate, and
          logistics.
        </p>

        <div className="hero-actions">
          <Magnetic className="btn-primary" href="#work">
            View Selected Work <span aria-hidden="true">↓</span>
          </Magnetic>
          <Magnetic className="btn-ghost" href="mailto:devilfruitd3v@proton.me">
            Contact Me
          </Magnetic>
        </div>

        <div className="stat-row">
          <div className="stat">
            <span className="num">{SITE_COUNT}</span>
            <span className="label">Sites shipped</span>
          </div>
          <div className="stat">
            <span className="num">{INDUSTRY_COUNT}</span>
            <span className="label">Industries</span>
          </div>
          <div className="stat">
            <span className="num">100%</span>
            <span className="label">Mobile-first</span>
          </div>
        </div>

        <div className="stack-row">
          {['React', 'JavaScript', 'Vite', 'APIs', 'Responsive'].map((s) => (
            <span className="stack-chip" key={s}>
              {s}
            </span>
          ))}
        </div>

        <div className="locale-strip">
          <span>MONTERREY, MX</span>
          <span className="locale-time">
            {time} LOCAL TIME <span className="dot-live" />
          </span>
        </div>
      </div>
    </header>
  );
}
