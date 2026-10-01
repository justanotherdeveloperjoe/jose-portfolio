import { useRef, useState } from 'react';

const colors = [{ name: 'Lime', value: '#d5f77a' }, { name: 'Apricot', value: '#edaa83' }, { name: 'Cream', value: '#eee8d8' }];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function ServiceCustomDemo({ inputRef }) {
  const [tab, setTab] = useState('poster'), [title, setTitle] = useState('OPEN MIC'), [color, setColor] = useState(colors[0].value);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  function start(event) {
    if (event.button !== 0 || drag.current) return;
    const surface = event.currentTarget.parentElement.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, width: surface.width, height: surface.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const current = drag.current;
    if (!current || event.pointerId !== current.id) return;
    setPosition({ x: clamp(current.start.x + (event.clientX - current.x) / current.width * 100, -35, 0), y: clamp(current.start.y + (event.clientY - current.y) / current.height * 100, -5, 36) });
  }
  function keyboard(event) {
    const shifts = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] };
    if (event.key === 'Home') { event.preventDefault(); setPosition({ x: 0, y: 0 }); }
    if (!shifts[event.key]) return;
    event.preventDefault();
    const [x, y] = shifts[event.key];
    setPosition(previous => ({ x: clamp(previous.x + x, -35, 0), y: clamp(previous.y + y, -5, 36) }));
  }
  return <div className="service-live-demo" style={{ '--demo-accent': color }}>
    <div className="service-demo-chrome"><span>EL SÓTANO / BRAND STUDIO</span><span>LIVE DEMO</span></div>
    <div className="service-demo-tabs" role="group" aria-label="Demo canvas"><span className={`service-demo-tab-indicator is-${tab}`} aria-hidden="true" />{['poster', 'merch'].map(item => <button type="button" key={item} aria-pressed={tab === item} aria-controls="service-demo-art" onClick={() => setTab(item)}>{item === 'poster' ? 'Make a poster' : 'Try it on merch'}</button>)}</div>
    <div className={`service-demo-art is-${tab}`} id="service-demo-art" role="group" aria-label={tab === 'poster' ? 'Live poster preview' : 'Live merchandise preview'}>
      <span className="service-demo-grid" aria-hidden="true" />
      {tab === 'poster' ? <div className="service-demo-poster"><span>EL SÓTANO CÓMICO PRESENTA</span><strong style={title.length > 14 ? { fontSize: 22 } : undefined}>{title.trim() || 'YOUR IDEA'}</strong><div><i aria-hidden="true">✳</i><span>GOOD JOKES.<br />GREAT COMPANY.</span></div><small>COMEDY / CULTURE / COMMUNITY</small></div> : <div className="service-demo-merch"><svg viewBox="0 0 240 230" role="img" aria-label={`T-shirt design: ${title.trim() || 'YOUR IDEA'}`}><path d="M75 14 25 39 5 90 48 108 62 80v135h116V80l14 28 43-18-20-51-50-25c-8 26-82 26-90 0Z" fill="var(--demo-accent)" stroke="#191b18" strokeWidth="2" /><path d="M75 14c5 38 85 38 90 0" fill="none" stroke="#191b18" strokeWidth="2" /><text x="120" y="98" textAnchor="middle" fontSize="7" fill="#191b18">EL SÓTANO CÓMICO</text><text x="120" y="124" textAnchor="middle" textLength={title.length > 12 ? 100 : undefined} lengthAdjust="spacingAndGlyphs" fontSize={title.length > 12 ? '9' : '14'} fontWeight="700" fill="#191b18">{title.trim() || 'YOUR IDEA'}</text><text x="120" y="150" textAnchor="middle" fontSize="8" fill="#191b18">GOOD COMPANY. ↗</text></svg><span>YOUR IDEA, IN ANOTHER FORM.</span></div>}
      <button type="button" className="service-demo-sticker" aria-label="Move the sticker. Drag or use arrow keys; Home resets." style={{ '--sticker-x': `${position.x}%`, '--sticker-y': `${position.y}%` }} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={keyboard}><span aria-hidden="true">✳</span><b>MAKE<br />SOME<br />NOISE.</b><small>DRAG ME ↔</small></button>
    </div>
    <div className="service-demo-controls"><label htmlFor="service-demo-title">Make it yours<input ref={inputRef} id="service-demo-title" value={title} maxLength={22} autoComplete="off" spellCheck={false} onChange={event => setTitle(event.target.value)} /></label><div role="group" aria-label="Demo ink color">{colors.map(ink => <button key={ink.name} type="button" aria-label={`${ink.name} ink`} aria-pressed={color === ink.value} onClick={() => setColor(ink.value)} style={{ '--swatch': ink.value }}><span /></button>)}</div></div>
    <div className="service-demo-footer"><span>Type. Switch. Drag. It’s yours to try.</span><button type="button" onClick={() => { setTitle('OPEN MIC'); setTab('poster'); setColor(colors[0].value); setPosition({ x: 0, y: 0 }); }}>Reset demo</button></div>
  </div>;
}
