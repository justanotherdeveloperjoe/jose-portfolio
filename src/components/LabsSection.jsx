import { useInView } from '../hooks/useInView.js';
import { labs } from '../data/growth.js';

export function LabsSection() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section className={`labs ${inView ? 'in' : ''}`} ref={ref}>
      <div className="labs-head">
        <span className="eyebrow">Labs</span>
        <h2>Things I built to understand how they work.</h2>
      </div>
      <div className="labs-grid">
        {labs.map((lab) => (
          <div className="lab-card" key={lab.num}>
            <span className="lab-num">{lab.num}</span>
            <h3 className="lab-title">{lab.title}</h3>
            <ul className="lab-items">
              {lab.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="lab-blurb">{lab.blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
