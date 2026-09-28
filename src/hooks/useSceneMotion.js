import { useEffect } from 'react';
import { gsap } from 'gsap';

// Finite, scoped animation. React owns the result, so motion is always optional.
export function useSceneMotion(ref, revision, animate) {
  useEffect(() => {
    if (!revision) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = animate(gsap.utils.selector(ref));
      const finish = () => timeline.progress(1);
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) finish();
      });
      observer.observe(ref.current);
      const visibility = () => { if (document.hidden) finish(); };
      document.addEventListener('visibilitychange', visibility);
      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', visibility);
      };
    }, ref);
    return () => media.revert();
  }, [ref, revision, animate]);
}
