import { useInView } from '../hooks/useInView.js';
import { buildPrinciples } from '../data/projects.js';

export function HowIBuild() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className={`interstitial ${inView ? 'in' : ''}`} ref={ref}>
      <div className="interstitial-inner">
        <span className="eyebrow">How I Build</span>
        <div className="principle-grid">
          {buildPrinciples.map((p) => (
            <div className="principle" key={p.num}>
              <span className="principle-num">{p.num}</span>
              <h4>{p.title}</h4>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
