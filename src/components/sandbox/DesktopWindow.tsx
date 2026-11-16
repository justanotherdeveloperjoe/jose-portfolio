import { useRef } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { DesktopIcon } from './DesktopIcon.tsx';

export interface WindowState { x: number; y: number; z: number; open: boolean; mounted?: boolean; maximized?: boolean }
export interface DesktopWindowProps {
  id: string;
  title: string;
  position: WindowState;
  front: boolean;
  onFocus: () => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onClose: () => void;
  onMaximize: () => void;
  maximized?: boolean;
  children?: ReactNode;
}
interface DragStart { x: number; y: number; left: number; top: number; width: number; height: number }

export function DesktopWindow({ id, title, position, front, onFocus, onMove, onClose, onMaximize, maximized, children }: DesktopWindowProps) {
  const drag = useRef<DragStart | null>(null), frame = useRef<HTMLElement>(null);
  // A window always renders inside .linux-screen, and its title bar inside the window.
  function down(event: PointerEvent<HTMLElement>) {
    if ((event.target as Element).closest('button') || event.button !== 0 || maximized || window.matchMedia('(max-width: 700px)').matches) return;
    const desktop = event.currentTarget.closest('.linux-screen')!.getBoundingClientRect();
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left - desktop.left, top: rect.top - desktop.top, width: desktop.width - rect.width, height: desktop.height - rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    const start = drag.current;
    onMove(id, { x: Math.max(0, Math.min(start.width, start.left + event.clientX - start.x)), y: Math.max(0, Math.min(start.height, start.top + event.clientY - start.y)) });
  }
  function center() {
    const rect = frame.current!.getBoundingClientRect(), screen = frame.current!.closest('.linux-screen')!.getBoundingClientRect();
    onMove(id, { x: Math.max(0, (screen.width - rect.width) / 2), y: Math.max(0, (screen.height - rect.height) / 2) });
  }
  return <section ref={frame} className={`linux-window linux-window-${id} ${front ? 'is-front' : ''} ${maximized ? 'is-maximized' : ''}`} style={{ left: position.x, top: position.y, zIndex: position.z, '--linux-window-top': `${position.y}px` } as CSSProperties} aria-label={title} onPointerDown={onFocus} onFocus={onFocus}>
    <header className="linux-window-title" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <span><DesktopIcon name={id} /><b>{title}</b></span>
      <div><button type="button" disabled={maximized} aria-label={`Center ${title} window`} onClick={center}><DesktopIcon name="center" /></button><button type="button" aria-label={`${maximized ? 'Restore' : 'Maximize'} ${title}`} onClick={onMaximize}><DesktopIcon name={maximized ? 'restore' : 'maximize'} /></button><button type="button" aria-label={`Close ${title}`} onClick={onClose}><DesktopIcon name="close" /></button></div>
    </header>
    <div className="linux-window-content">{children}</div>
  </section>;
}
