import { useRef } from 'react';
import type { AnchorHTMLAttributes, ElementType, MouseEvent } from 'react';

type MagneticProps = AnchorHTMLAttributes<HTMLElement> & { as?: ElementType };

const isFinePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export function Magnetic({ as: Tag = 'a', className = '', children, ...props }: MagneticProps) {
  const ref = useRef<HTMLElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    if (!isFinePointer || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.5}px)`;
  }

  function handleMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0, 0)';
  }

  return (
    <Tag
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Tag>
  );
}
