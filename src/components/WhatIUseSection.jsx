import { useInView } from '../hooks/useInView.js';
import { skillCategories } from '../data/growth.js';

export function WhatIUseSection() {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <section className={`whatiuse ${inView ? 'in' : ''}`} ref={ref}>
      <div className="whatiuse-head">
        <span className="eyebrow">What I Work With</span>
      </div>

      <div className="whatiuse-categories">
        {skillCategories.map((cat) => (
          <div className="whatiuse-cat" key={cat.name}>
            <h4>{cat.name}</h4>
            <ul>
              {cat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
