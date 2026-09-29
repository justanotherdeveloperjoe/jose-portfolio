import { useEffect, useRef, useState } from 'react';

const colors = [{ name: 'Ink', value: '#30382c' }, { name: 'Moss', value: '#788958' }, { name: 'Clay', value: '#bb7357' }, { name: 'Slate', value: '#607d92' }];
const width = 1000, height = 650, paper = '#faf8ef';

export function DesktopSketchpad() {
  const canvas = useRef(null), strokes = useRef([]), current = useRef(null), frame = useRef(null);
  const [color, setColor] = useState(colors[0].value), [size, setSize] = useState(4), [eraser, setEraser] = useState(false), [count, setCount] = useState(0), [message, setMessage] = useState(''), [confirmClear, setConfirmClear] = useState(false);
  function drawStroke(context, stroke) {
    context.strokeStyle = stroke.color; context.fillStyle = stroke.color; context.lineWidth = stroke.size;
    context.lineCap = 'round'; context.lineJoin = 'round';
    const [first, ...rest] = stroke.points;
    context.beginPath(); context.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2); context.fill();
    if (rest.length) { context.beginPath(); context.moveTo(first.x, first.y); for (const point of rest) context.lineTo(point.x, point.y); context.stroke(); }
  }
  function paint() {
    frame.current = null;
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.fillStyle = paper; context.fillRect(0, 0, width, height);
    for (const stroke of strokes.current) drawStroke(context, stroke);
    if (current.current) drawStroke(context, current.current);
  }
  function redraw() { if (frame.current === null) frame.current = requestAnimationFrame(paint); }
  useEffect(() => { paint(); return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }; }, []);
  function point(event) {
    const bounds = canvas.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(width, (event.clientX - bounds.left) / bounds.width * width)), y: Math.max(0, Math.min(height, (event.clientY - bounds.top) / bounds.height * height)) };
  }
  function down(event) {
    if (event.button !== 0 || current.current) return;
    if (strokes.current.length >= 150) { setMessage('This sketch has 150 strokes. Download it, then start a new one.'); return; }
    event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
    current.current = { pointer: event.pointerId, color: eraser ? paper : color, size: eraser ? size * 5 : size, points: [point(event)] };
    setMessage(''); redraw();
  }
  function move(event) {
    const stroke = current.current;
    if (!stroke || stroke.pointer !== event.pointerId || stroke.points.length >= 1500) return;
    stroke.points.push(point(event)); redraw();
  }
  function finish(event) {
    if (!current.current || current.current.pointer !== event.pointerId) return;
    strokes.current.push(current.current); current.current = null; setCount(strokes.current.length); redraw();
  }
  function undo() { strokes.current.pop(); setCount(strokes.current.length); redraw(); }
  function download() {
    paint();
    canvas.current.toBlob(blob => {
      if (!blob) { setMessage('The drawing could not be downloaded. Please try again.'); return; }
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'studio-sketch.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Sketch downloaded.');
    }, 'image/png');
  }
  return <div className="linux-utility linux-sketchpad">
    <div className="linux-sketch-tools"><div role="group" aria-label="Pen colors">{colors.map(ink => <button type="button" key={ink.name} aria-label={`${ink.name} pen`} aria-pressed={color === ink.value && !eraser} onClick={() => { setColor(ink.value); setEraser(false); }}><span style={{ background: ink.value }} /></button>)}</div><button type="button" aria-pressed={eraser} onClick={() => setEraser(value => !value)}>Eraser</button><label>Size <select aria-label="Pen size" value={size} onChange={event => setSize(Number(event.target.value))}><option value="4">Fine</option><option value="8">Medium</option><option value="14">Bold</option></select></label></div>
    <canvas ref={canvas} width={width} height={height} tabIndex="0" aria-label="Sketch canvas. Draw with a mouse, pen, or touch. Control Z undoes the last stroke." onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } }}>A drawing canvas. Use a pointer or touch to sketch.</canvas>
    <div className="linux-sketch-actions"><button type="button" disabled={!count} onClick={undo}>Undo</button><button type="button" disabled={!count} onClick={() => setConfirmClear(true)}>Clear</button><span>{count ? `${count} ${count === 1 ? 'stroke' : 'strokes'}` : 'Room for an idea.'}</span><button type="button" className="linux-primary" onClick={download}>Download PNG</button></div>
    {confirmClear && <div className="linux-sketch-clear"><span>Start a fresh sketch?</span><button type="button" onClick={() => { strokes.current = []; current.current = null; setCount(0); setConfirmClear(false); setMessage('A fresh page.'); redraw(); }}>Clear sketch</button><button type="button" onClick={() => setConfirmClear(false)}>Keep drawing</button></div>}
    <p className="linux-utility-status" role="status">{message || 'Kept during this visit. Download your sketch before reloading.'}</p>
  </div>;
}
