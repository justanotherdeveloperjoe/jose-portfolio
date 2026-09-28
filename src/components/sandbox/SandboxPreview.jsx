import { useEffect, useMemo, useRef, useState } from 'react';
import { templates } from '../../data/sandbox.js';
import { buildPreview, sourceSize, SOURCE_LIMIT } from '../../lib/sandbox/preview.js';

export function SandboxPreview({ state, setState }) {
  const [message, setMessage] = useState('');
  const selector = useRef(null);
  useEffect(() => { selector.current?.focus({ preventScroll: true }); }, []);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const draft = state.drafts[state.example];
  const template = templates[state.example];
  const dirty = draft.html !== draft.applied.html || draft.css !== draft.applied.css;
  const document = useMemo(() => buildPreview(draft.applied, reduced), [draft.applied, reduced]);
  function updateDraft(update) {
    setState(previous => ({ ...previous, drafts: { ...previous.drafts, [previous.example]: { ...previous.drafts[previous.example], ...update } } }));
  }
  function edit(field, value) {
    if (sourceSize(value) > SOURCE_LIMIT) { setMessage(`${field.toUpperCase()} must stay under 20 KB. That edit was not applied.`); return; }
    updateDraft({ [field]: value }); setMessage('');
  }
  function run() { updateDraft({ applied: { html: draft.html, css: draft.css } }); setMessage('Preview updated.'); }
  function reset() {
    updateDraft({ html: template.html, css: template.css, applied: { html: template.html, css: template.css }, undo: { html: draft.html, css: draft.css, applied: draft.applied } });
    setMessage('Example reset. You can undo this.');
  }
  function undo() { updateDraft({ ...draft.undo, undo: null }); setMessage('Your previous version is back.'); }

  return <div className="sandbox-maker">
    <div className="sandbox-examplebar"><label htmlFor="sandbox-example">A place to start<select ref={selector} id="sandbox-example" value={state.example} onChange={event => { setState(previous => ({ ...previous, example: event.target.value })); setMessage(''); }}>{Object.entries(templates).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><p>{template.hint}</p></div>
    <div className="sandbox-editor-grid">
      <div className="sandbox-sources">{['html', 'css'].map(field => <div className="sandbox-source" key={field}><label htmlFor={`sandbox-${field}`}>{field.toUpperCase()}<span>{(sourceSize(draft[field]) / 1024).toFixed(1)} / 20 KB</span></label><textarea id={`sandbox-${field}`} value={draft[field]} onChange={event => edit(field, event.target.value)} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-describedby="sandbox-editor-note" /></div>)}</div>
      <div className="sandbox-preview-pane"><div className="sandbox-preview-label"><span>YOUR LITTLE EXPERIMENT</span><span>{dirty ? 'Unapplied changes' : 'Preview up to date'}</span></div><iframe title="Your HTML and CSS experiment" sandbox="" referrerPolicy="no-referrer" srcDoc={document} /><p id="sandbox-editor-note">HTML + CSS. Change a few lines, then run your preview. Scripts and outside resources stay off.</p></div>
    </div>
    <div className="sandbox-editor-actions"><button type="button" className="sandbox-run" onClick={run}>Run preview <span aria-hidden="true">↗</span></button><button type="button" onClick={reset}>Reset example</button>{draft.undo && <button type="button" onClick={undo}>Undo reset</button>}<span role="status">{message || (dirty ? 'Ready when you are.' : 'A small start. Yours to change.')}</span></div>
  </div>;
}
