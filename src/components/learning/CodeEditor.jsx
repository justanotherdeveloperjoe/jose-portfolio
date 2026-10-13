import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { highlight } from '../../lib/highlight.js';

// A real text box for code, with syntax colors drawn underneath it. The box itself is transparent and the
// colored copy sits exactly behind it, so typing, selecting and pasting all behave like a normal text box.
// Tab indents; Esc then Tab moves on to the next control; Ctrl/⌘ + Enter runs.
export function CodeEditor({ value, onChange, onRun, language, label }) {
  const box = useRef(null);
  const leaving = useRef(false);
  const hintId = useId();
  const pieces = useMemo(() => highlight(value, language), [value, language]);

  // Grow with the code, so the colored copy and the text box always have the same height.
  useLayoutEffect(() => {
    const element = box.current;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  function keyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); onRun(); return; }
    if (event.key === 'Escape') { leaving.current = true; return; }
    if (event.key === 'Tab' && !event.shiftKey && !leaving.current) {
      event.preventDefault();
      const element = event.currentTarget, start = element.selectionStart, end = element.selectionEnd;
      onChange(`${value.slice(0, start)}  ${value.slice(end)}`);
      requestAnimationFrame(() => { element.selectionStart = element.selectionEnd = start + 2; });
      return;
    }
    leaving.current = false;
  }

  return <div className="code-editor">
    <pre className="code-colors" aria-hidden="true">{pieces.map((piece, i) => piece.type === 'plain' ? piece.text : <span key={i} className={`code-${piece.type}`}>{piece.text}</span>)}{'\n'}</pre>
    <textarea ref={box} value={value} onChange={event => onChange(event.target.value)} onKeyDown={keyDown} aria-label={label} aria-describedby={hintId} spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" rows={1} />
    <span id={hintId} className="code-hint">Tab indents. Press Escape, then Tab, to move on. Control or Command plus Enter runs it.</span>
  </div>;
}
