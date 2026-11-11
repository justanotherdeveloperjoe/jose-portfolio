import { Asterisk as PhAsterisk, ArrowsLeftRight as PhArrowsLeftRight, Lightning as PhLightning } from '@phosphor-icons/react';
import { useRef, useState } from 'react';

const colors = [{ name: 'Lime', value: '#d5f77a' }, { name: 'Apricot', value: '#edaa83' }, { name: 'Cream', value: '#eee8d8' }];
const bulbCount = 24;
function bulbPositions(count) {
  return Array.from({ length: count }, (_, i) => {
    const q = i / count * 4;
    if (q < 1) return { x: q * 100, y: 0 };
    if (q < 2) return { x: 100, y: (q - 1) * 100 };
    if (q < 3) return { x: (3 - q) * 100, y: 100 };
    return { x: 0, y: (4 - q) * 100 };
  });
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function ServiceCustomDemo({ inputRef }) {
  const [tab, setTab] = useState('poster'), [title, setTitle] = useState('OPEN MIC'), [color, setColor] = useState(colors[0].value);
  const [position, setPosition] = useState({ x: 0, y: 0 }), [show, setShow] = useState(0);
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
    <div className={`service-demo-art is-${tab}`} id="service-demo-art" role="group" aria-label={tab === 'poster' ? 'Live poster preview' : 'Live merchandise preview'}>
      <span className="service-demo-grid" aria-hidden="true" />
      {tab === 'poster' ? <div className="lm" key={show} style={{ '--demo-accent': color }}><div className="lm-bulbs" aria-hidden="true">{bulbPositions(bulbCount).map((b, i) => <i key={i} className="lm-bulb" style={{ left: `${b.x}%`, top: `${b.y}%`, '--i': i }} />)}</div><span className="lm-kicker">EL SÓTANO CÓMICO PRESENTA</span><strong className="lm-title" style={title.length > 14 ? { fontSize: 'clamp(15px, 2.4vw, 22px)' } : undefined}>{(title.trim() || 'YOUR IDEA').split('').map((ch, i) => <span key={i + ch} className="lm-letter" style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>)}</strong><span className="lm-stub">ADMIT ONE · NO. {String((title.length * 9301 + color.length * 49297) % 100000).padStart(5, '0')}</span></div> : <div className="service-demo-merch"><svg viewBox="0 0 240 230" role="img" aria-label={`T-shirt design: ${title.trim() || 'YOUR IDEA'}`}><path d="M75 14 25 39 5 90 48 108 62 80v135h116V80l14 28 43-18-20-51-50-25c-8 26-82 26-90 0Z" fill="var(--demo-accent)" stroke="#191b18" strokeWidth="2" /><path d="M75 14c5 38 85 38 90 0" fill="none" stroke="#191b18" strokeWidth="2" /><text x="120" y="98" textAnchor="middle" fontSize="7" fill="#191b18">EL SÓTANO CÓMICO</text><text x="120" y="124" textAnchor="middle" textLength={title.length > 12 ? 100 : undefined} lengthAdjust="spacingAndGlyphs" fontSize={title.length > 12 ? '9' : '14'} fontWeight="700" fill="#191b18">{title.trim() || 'YOUR IDEA'}</text><text x="120" y="150" textAnchor="middle" fontSize="8" fill="#191b18">GOOD COMPANY.</text><path d="M158 150 L166 142 M160 142 H166 V148" fill="none" stroke="#191b18" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span>YOUR IDEA, IN ANOTHER FORM.</span></div>}
      <button type="button" className="service-demo-sticker" aria-label="Move the sticker. Drag or use arrow keys; Home resets." style={{ '--sticker-x': `${position.x}%`, '--sticker-y': `${position.y}%` }} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={keyboard}><span aria-hidden="true"><PhAsterisk aria-hidden="true" className="ph-icon" /></span><b>MAKE<br />SOME<br />NOISE.</b><small>DRAG ME <PhArrowsLeftRight aria-hidden="true" className="ph-icon" /></small></button>
    </div>
    <div className="service-demo-toolbar" role="group" aria-label="Customize the design">
      <div className="service-demo-toolbar-top">
        <div className="service-demo-tabs" role="group" aria-label="Demo canvas">
          <span className={`service-demo-tab-indicator is-${tab}`} aria-hidden="true" />
          {['poster', 'merch'].map(item => <button type="button" key={item} aria-label={item === 'poster' ? 'Make a poster' : 'Try it on merch'} aria-pressed={tab === item} aria-controls="service-demo-art" onClick={() => setTab(item)}>{item === 'poster' ? 'Poster' : 'Merch'}</button>)}
        </div>
        <button className="service-demo-reset" type="button" aria-label="Reset demo" onClick={() => { setTitle('OPEN MIC'); setTab('poster'); setColor(colors[0].value); setPosition({ x: 0, y: 0 }); }}>Reset <span aria-hidden="true">&#8634;</span></button>
      </div>
      <div className="service-demo-vibes"><button type="button" className="service-demo-light" onClick={() => setShow(value => value + 1)}><PhLightning aria-hidden="true" className="ph-icon" />Light it up</button></div>
      <div className="service-demo-controls">
        <label htmlFor="service-demo-title"><span>Make it yours</span><input ref={inputRef} id="service-demo-title" value={title} maxLength={22} autoComplete="off" spellCheck={false} onChange={event => setTitle(event.target.value)} /></label>
        <div role="group" aria-label="Demo ink color">{colors.map(ink => <button key={ink.name} type="button" aria-label={`${ink.name} ink`} aria-pressed={color === ink.value} onClick={() => setColor(ink.value)} style={{ '--swatch': ink.value }}><span /></button>)}</div>
      </div>
    </div>
  </div>;
}
