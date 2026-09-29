import { useEffect, useRef, useState } from 'react';
import { bytes, MAX_FILE, saveFile } from '../../lib/sandbox/home.js';

export function SandboxFileEditor({ state, setState, onReturn }) {
  const [message, setMessage] = useState('');
  const area = useRef(null);
  const editor = state.editor;
  useEffect(() => { area.current?.focus({ preventScroll: true }); }, []);
  function save(close = false) {
    try {
      if (!editor.readOnly) {
        const home = saveFile(state.home, editor.path, editor.content);
        setState(previous => ({ ...previous, home })); setMessage('File saved.');
      }
      if (close) onReturn();
    } catch (error) { setMessage(error.message); }
  }
  return <div className="computer-editor" onKeyDown={event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); save(true); }
  }}>
    <div className="computer-appbar"><span>{editor.readOnly ? 'READ ONLY' : 'TEXT EDITOR'} / {editor.path.split('/').pop()}</span><span>{bytes(editor.content)} / {MAX_FILE} bytes</span></div>
    <label className="sandbox-sr-only" htmlFor="computer-file">File contents</label>
    <textarea id="computer-file" ref={area} value={editor.content} readOnly={editor.readOnly} spellCheck={false} autoCapitalize="off" onChange={event => {
      if (bytes(event.target.value) > MAX_FILE) { setMessage('File limit: 20 KB. That edit was not applied.'); return; }
      setState(previous => ({ ...previous, editor: { ...previous.editor, content: event.target.value } })); setMessage('Unsaved changes');
    }} />
    <div className="computer-editor-controls">{!editor.readOnly && <button type="button" onClick={() => save()}>Save <kbd>Ctrl+S</kbd></button>}<button type="button" onClick={() => save(true)}>{editor.readOnly ? 'Return' : 'Save & return'} <kbd>Esc</kbd></button>{!editor.readOnly && <button type="button" onClick={onReturn}>Discard & return</button>}<span role="status">{message}</span></div>
  </div>;
}
