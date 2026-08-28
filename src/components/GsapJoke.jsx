import { useInView } from '../hooks/useInView.js';

export function GsapJoke() {
  const [ref, inView] = useInView({ threshold: 0.5 });

  return (
    <section className={`gsap-joke ${inView ? 'in' : ''}`} ref={ref}>
      <span className="gsap-joke-num">04 / 08</span>
      <p className="gsap-joke-line1">You made it this far.</p>
      <p className="gsap-joke-line2">
        Unfortunately, <span className="gsap-joke-chaos">I discovered GSAP.</span>
      </p>
      <p className="gsap-joke-line3">I'll behave now.</p>
    </section>
  );
}
