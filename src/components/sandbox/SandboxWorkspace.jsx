import { useEffect, useRef, useState } from 'react';
import { appendCommand, executeCommand, limits } from '../../lib/sandbox/commands.js';
import { templates } from '../../data/sandbox.js';
import { SandboxPreview } from './SandboxPreview.jsx';
import './SandboxWorkspace.css';

export function navigateTo(target) {
  const element = document.getElementById(target.replace(/^#/, ''));
  if (!element) return;
  element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const heading = element.matches('h1,h2,h3,h4') ? element : element.querySelector('h2,h3,h4') || element;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function initialSession() {
  return {
    cwd: '/', history: [], output: [], view: 'explore', theme: 'charcoal', example: 'button',
    drafts: Object.fromEntries(Object.entries(templates).map(([key, value]) => [key, { html: value.html, css: value.css, applied: { html: value.html, css: value.css }, undo: null }])),
  };
}

export default function SandboxWorkspace({ session, onClose, onArcade }) {
  const [state, setState] = useState(() => session.current || initialSession());
  const [command, setCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const input = useRef(null);
  const heading = useRef(null);
  const output = useRef(null);
  const draftCommand = useRef('');
  useEffect(() => { session.current = state; }, [state, session]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [state.output]);

  function run(value) {
    if (!value.trim()) return;
    const result = executeCommand(value, state.cwd);
    setState(previous => {
      const next = appendCommand(previous, value, result);
      if (result.action?.type === 'edit') { next.view = 'make'; next.example = result.action.example; }
      if (result.action?.type === 'theme') next.theme = result.action.theme;
      return next;
    });
    setCommand(''); setHistoryIndex(null); draftCommand.current = '';
    setAnnouncement(`${value}: ${result.clear ? 'Screen cleared.' : result.text.slice(0, 180) || `Now in ${result.cwd}.`}`);
    if (result.action?.type === 'navigate') navigateTo(result.action.target);
    else if (result.action?.type === 'arcade') onArcade();
    else if (result.action?.type !== 'edit') input.current?.focus({ preventScroll: true });
  }

  function recall(event) {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key) || !state.history.length) return;
    event.preventDefault();
    if (historyIndex === null) draftCommand.current = command;
    const index = Math.max(0, Math.min(state.history.length, (historyIndex ?? state.history.length) + (event.key === 'ArrowUp' ? -1 : 1)));
    setHistoryIndex(index); setCommand(index === state.history.length ? draftCommand.current : state.history[index]);
  }

  function link(event, href) {
    if (!href.startsWith('#') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigateTo(href);
  }

  return <div className={`sandbox-workspace sandbox-${state.theme}`} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }}>
    <div className="sandbox-toolbar"><h3 ref={heading} tabIndex={-1}>jose@studio <span>/ a work in progress</span></h3><span className="sandbox-local"><i aria-hidden="true" /> In your browser</span></div>
    <div className="sandbox-viewbar"><div role="group" aria-label="Workspace view"><button type="button" aria-pressed={state.view === 'explore'} onClick={() => setState(previous => ({ ...previous, view: 'explore' }))}>01 / Explore</button><button type="button" aria-pressed={state.view === 'make'} onClick={() => setState(previous => ({ ...previous, view: 'make' }))}>02 / Make something</button></div><button type="button" className="sandbox-palette" onClick={() => setState(previous => ({ ...previous, theme: previous.theme === 'cream' ? 'charcoal' : 'cream' }))} aria-label={`Use ${state.theme === 'cream' ? 'charcoal' : 'cream'} workspace colors`}>◐ <span>Change atmosphere</span></button></div>
    {state.view === 'explore' ? <div className="sandbox-explore">
      <div className="sandbox-terminal">
        <div className="sandbox-output" ref={output} tabIndex={0} role="region" aria-label="Terminal history">
          <div className="sandbox-welcome"><span>WELCOME TO MY LITTLE CORNER.</span><p>Look around. Follow your curiosity.<br />There’s no wrong place to start.</p><p className="sandbox-terminal-note">Type <b>help</b> for a few familiar commands.</p></div>
          {state.output.map((entry, index) => <div className="sandbox-entry" key={index}><div className="sandbox-command"><span>jose@studio:{entry.cwd === '/' ? '~' : entry.cwd}$</span> {entry.command}</div>{entry.text && <pre>{entry.text}</pre>}{entry.links && <div className="sandbox-result-links">{entry.links.map(item => <a key={item.href} href={item.href} onClick={event => link(event, item.href)} {...(!item.href.startsWith('#') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>)}</div>}</div>)}
        </div>
        <form className="sandbox-prompt" onSubmit={event => { event.preventDefault(); run(command); }}><label htmlFor="sandbox-command"><span>jose@studio</span><b>{state.cwd === '/' ? '~' : state.cwd}$</b><span className="sandbox-sr-only"> Enter a command</span></label><div><input ref={input} id="sandbox-command" value={command} maxLength={limits.command} onChange={event => { setCommand(event.target.value); setHistoryIndex(null); }} onKeyDown={recall} placeholder="Try help" autoComplete="off" autoCapitalize="off" spellCheck={false} /><button type="submit" aria-label="Run command">↵</button></div></form>
      </div>
      <aside className="sandbox-guide"><span className="sandbox-eyebrow">A FEW OPEN DOORS</span><h4>Start with<br /><em>a little curiosity.</em></h4><p>No terminal experience needed. Pick something below, or type your own command.</p><div className="sandbox-suggestions">{[['ls projects', 'Explore the work'], ['learn react', 'See what I’m learning'], ['edit postcard', 'Make a little landscape'], ['play invaders', 'Take a little break']].map(([value, label]) => <button type="button" key={value} onClick={() => run(value)}><span>{label}<code>{value}</code></span><span aria-hidden="true">↗</span></button>)}</div><p className="sandbox-guide-note">A small browser sandbox with a few familiar commands. Your experiments stay here until you reload.</p></aside>
    </div> : <SandboxPreview state={state} setState={setState} />}
    <div className="sandbox-workspace-footer"><span>Curiosity is a good place to start.</span><button type="button" onClick={onClose}>Close sandbox ↑</button></div>
    <span className="sandbox-sr-only" role="status">{announcement}</span>
  </div>;
}
