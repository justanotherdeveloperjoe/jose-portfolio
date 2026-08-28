import { useInView } from '../hooks/useInView.js';
import { buildingFlow } from '../data/growth.js';

export function CurrentlyBuildingSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const { frontend, backend, cloud } = buildingFlow;

  return (
    <section className={`building ${inView ? 'in' : ''}`} ref={ref}>
      <span className="eyebrow">Currently Building</span>
      <h2>Full-stack development</h2>

      <div className="building-cols">
        <div className="building-col building-col-a">
          <h4>{frontend.label}</h4>
          <ul>
            {frontend.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div className="building-col building-col-b">
          <h4>{backend.label}</h4>
          <ul>
            {backend.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="building-connector" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="building-cloud">
        <h4>{cloud.label}</h4>
        <p>{cloud.items.join(' · ')}</p>
      </div>

      <p className="building-note">I'm not just collecting technologies. I'm connecting them.</p>
    </section>
  );
}
