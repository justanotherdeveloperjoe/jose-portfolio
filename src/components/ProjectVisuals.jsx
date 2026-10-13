import { useEffect, useId, useRef } from 'react';
import './MountainSignature.css';

const ridge = 'M0 215 100 185 185 202 300 141 385 174 485 65 540 104 610 30 672 80 741 161 830 130 950 187 1080 141 1200 200 1330 169 1440 218';
const facets = 'm385 174 99-60 57 30 69-114m-69 114 131-64';
const foothills = 'M-20 236 180 217 335 231 475 194 639 225 823 185 990 229 1168 200 1300 233 1460 222';

export function MountainSignature() {
  const landscape = useRef(null);
  const light = useRef(null);
  const lightId = `mountain-light-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const element = landscape.current;
    const contact = element.closest('.studio')?.querySelector('#contact');
    if (!contact) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const current = { x: 0, y: 0, glow: .32 };
    const target = { ...current };
    const visibleParts = new Set();
    let visible = false, frame = 0, lastTime = 0, inside = false;

    function paint() {
      element.style.setProperty('--ridge-x', `${(current.x * 3).toFixed(3)}px`);
      element.style.setProperty('--ridge-y', `${(current.y * 1.2).toFixed(3)}px`);
      element.style.setProperty('--foothill-x', `${(current.x * 7).toFixed(3)}px`);
      element.style.setProperty('--foothill-y', `${(current.y * 2.4).toFixed(3)}px`);
      element.style.setProperty('--ridge-glow', current.glow.toFixed(3));
      light.current.setAttribute('cx', (720 + current.x * 500).toFixed(2));
    }
    function cancel() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    function tick(time) {
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      const blend = 1 - Math.exp(-elapsed / 125);
      lastTime = time;
      let remaining = 0;
      for (const key of Object.keys(current)) {
        current[key] += (target[key] - current[key]) * blend;
        remaining += Math.abs(target[key] - current[key]);
      }
      if (remaining < .002) {
        Object.assign(current, target); frame = 0; lastTime = 0;
      } else frame = requestAnimationFrame(tick);
      paint();
    }
    function requestPaint() {
      if (visible && !document.hidden && !reduced.matches && !frame) frame = requestAnimationFrame(tick);
    }
    function settle() {
      inside = false;
      Object.assign(target, { x: 0, y: 0, glow: .32 });
      if (reduced.matches || !visible || document.hidden) {
        cancel(); Object.assign(current, target); paint();
      } else requestPaint();
    }
    function move(event) {
      if (!visible || reduced.matches || !pointer.matches || event.pointerType === 'touch') return;
      const top = contact.getBoundingClientRect().top;
      const bottom = element.getBoundingClientRect().bottom;
      if (event.clientY < top || event.clientY > bottom) { if (inside) settle(); return; }
      inside = true;
      target.x = Math.max(-1, Math.min(1, event.clientX / innerWidth * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY - top) / Math.max(1, bottom - top) * 2 - 1));
      target.glow = .72;
      requestPaint();
    }
    function scroll() {
      if (!visible || reduced.matches) return;
      if (pointer.matches) { if (inside) settle(); return; }
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)));
      target.x = (progress - .5) * .65;
      target.y = (progress - .5) * 1.4;
      target.glow = .44;
      requestPaint();
    }
    function preferenceChange() { settle(); if (!reduced.matches && !pointer.matches) scroll(); }
    function leave(event) { if (!event.relatedTarget) settle(); }
    function visibilityChange() { if (document.hidden) settle(); else scroll(); }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visibleParts.add(entry.target) : visibleParts.delete(entry.target));
      visible = visibleParts.size > 0;
      if (!visible) settle(); else if (!pointer.matches) scroll();
    });
    observer.observe(contact); observer.observe(element);
    paint();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', preferenceChange, { passive: true });
    window.addEventListener('blur', settle);
    document.addEventListener('visibilitychange', visibilityChange);
    reduced.addEventListener('change', preferenceChange);
    pointer.addEventListener('change', preferenceChange);
    return () => {
      cancel(); observer.disconnect();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerout', leave);
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', preferenceChange);
      window.removeEventListener('blur', settle); document.removeEventListener('visibilitychange', visibilityChange);
      reduced.removeEventListener('change', preferenceChange); pointer.removeEventListener('change', preferenceChange);
    };
  }, []);

  return <div ref={landscape} className="mountain-signature" aria-hidden="true">
    <div className="mountain-caption"><span>MADE IN MONTERREY</span><span>WITH CURIOSITY & A LITTLE CAFFEINE.</span><span>25.6866° N / 100.3161° W</span></div>
    <svg className="mountain-landscape" viewBox="0 0 1440 240" fill="none" preserveAspectRatio="none">
      <defs><radialGradient ref={light} id={lightId} gradientUnits="userSpaceOnUse" cx="720" cy="100" r="460" gradientTransform="translate(0 70) scale(1 .3)"><stop stopColor="#edffd0" stopOpacity=".9" /><stop offset=".45" stopColor="#e0f8ad" stopOpacity=".45" /><stop offset="1" stopColor="#d5f77a" stopOpacity="0" /></radialGradient></defs>
      <g className="mountain-ridge">
        <path d={`${ridge}V248H0Z`} fill="currentColor" fillOpacity=".045" />
        <path d={ridge} stroke="currentColor" strokeOpacity=".45" />
        <path d={facets} stroke="currentColor" strokeOpacity=".16" />
        <g className="mountain-illumination"><path d={`${ridge}V248H0Z`} fill={`url(#${lightId})`} fillOpacity=".06" /><path d={ridge} stroke={`url(#${lightId})`} strokeWidth="2" /><path d={facets} stroke={`url(#${lightId})`} strokeWidth="1.3" /></g>
      </g>
      <g className="mountain-foothills"><path d={`${foothills}V250H-20Z`} fill="currentColor" fillOpacity=".022" /><path d={foothills} stroke="currentColor" strokeOpacity=".2" /></g>
    </svg>
  </div>;
}
