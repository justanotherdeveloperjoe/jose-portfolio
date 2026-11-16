import { ArrowUpRight as PhArrowUpRight } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { appendCommand, executeCommand, limits } from '../../lib/sandbox/commands.ts';
import { completeCommand } from '../../lib/sandbox/computer.ts';
import { HOME, STORAGE_KEY, displayPath, readHome, freshHome } from '../../lib/sandbox/home.ts';
import { runJavaScript } from '../../lib/sandbox/runner.ts';
import type { KeyboardEvent, MouseEvent, MutableRefObject } from 'react';
import type { OutputEntry } from '../../lib/sandbox/commands.ts';
import type { FileAction, RunAction } from '../../lib/sandbox/computer.ts';
import type { Home, Persistence } from '../../lib/sandbox/home.ts';
import { templates } from '../../data/sandbox.ts';
import { SandboxPreview } from './SandboxPreview.tsx';
import { SandboxFileEditor } from './SandboxFileEditor.tsx';
import './SandboxWorkspace.css';
import './SandboxComputer.css';

interface Source { html: string; css: string }
export interface Draft extends Source { applied: Source; undo: (Source & { applied: Source }) | null }
export interface WorkspaceState {
  home: Home;
  persistence: Persistence;
  cwd: string;
  history: string[];
  output: OutputEntry[];
  view: string;
  theme: string;
  example: string;
  welcome: boolean;
  editor: FileAction | null;
  drafts: Record<string, Draft>;
}
interface SandboxWorkspaceProps { session: MutableRefObject<WorkspaceState | null>; onClose: () => void; onArcade: () => void; active?: boolean }

export function navigateTo(target: string) {
  const element = document.getElementById(target.replace(/^#/, ''));
  if (!element) return;
  element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  const heading = element.matches('h1,h2,h3,h4') ? element : element.querySelector<HTMLElement>('h2,h3,h4') || element;
  heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true });
}

function initialSession(): WorkspaceState {
  let saved: { home: Home; persistence: Persistence };
  try { saved = readHome(window.localStorage); } catch { saved = { home: freshHome(), persistence: 'session' }; }
  return { ...saved, cwd: HOME, history: [], output: [], view: 'terminal', theme: 'charcoal', example: 'button', welcome: true, editor: null,
    drafts: Object.fromEntries(Object.entries(templates).map(([key, value]) => [key, { html: value.html, css: value.css, applied: { html: value.html, css: value.css }, undo: null }])),
  };
}

export default function SandboxWorkspace({ session, onClose, onArcade, active = true }: SandboxWorkspaceProps) {
  const [state, setState] = useState(() => session.current || initialSession());
  const [command, setCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [completions, setCompletions] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null), output = useRef<HTMLDivElement>(null), stopProcess = useRef<(() => void) | null>(null), alive = useRef(true), draftCommand = useRef('');
  useEffect(() => { session.current = state; }, [state, session]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.home)); }
    catch { setState(previous => previous.persistence === 'session' ? previous : { ...previous, persistence: 'session' }); }
  }, [state.home]);
  useEffect(() => {
    alive.current = true;
    const hidden = () => { if (document.hidden) stopProcess.current?.(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { alive.current = false; stopProcess.current?.(); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => { if (!active) stopProcess.current?.(); }, [active]);
  useEffect(() => { if (state.view === 'terminal' && active) input.current?.focus({ preventScroll: true }); }, [state.view, active]);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [state.output, completions, running]);
  useEffect(() => {
    if (!output.current) return;
    const observer = new ResizeObserver(() => {
      if (document.activeElement === input.current && output.current) output.current.scrollTop = output.current.scrollHeight;
    });
    observer.observe(output.current);
    return () => observer.disconnect();
  }, [state.view]);

  function print(text: string, error = false) {
    if (!alive.current) return;
    setState(previous => ({ ...previous, output: [...previous.output, { text: text.slice(0, limits.entry), error }].slice(-limits.output) }));
  }
  function launchScript(action: RunAction) {
    setRunning(true);
    stopProcess.current = runJavaScript(action.code, { expression: action.expression, onLine: text => print(text), onDone: message => {
      stopProcess.current = null;
      if (!alive.current) return;
      setRunning(false); print(message, !message.startsWith('Process finished')); setAnnouncement(message); input.current?.focus({ preventScroll: true });
    } });
  }
  function run(value: string) {
    if (!value.trim() || running) return;
    const result = executeCommand(value, state.cwd, state);
    setState(previous => {
      const next = appendCommand(previous, value, result);
      if (result.clear) next.welcome = false;
      if (result.action?.type === 'edit') { next.view = 'make'; next.example = result.action.example; }
      if (result.action?.type === 'file') { next.view = 'file'; next.editor = result.action; }
      if (result.action?.type === 'theme') next.theme = result.action.theme;
      return next;
    });
    setCommand(''); setHistoryIndex(null); setCompletions([]); draftCommand.current = '';
    setAnnouncement(`${value}: ${result.clear ? 'Screen cleared.' : result.text.slice(0, 180) || 'Done.'}`);
    const action = result.action;
    if (action?.type === 'navigate') navigateTo(action.target);
    else if (action?.type === 'arcade') onArcade();
    else if (action?.type === 'exit') onClose();
    else if (action?.type === 'run') launchScript(action);
    else if (action?.type === 'download') {
      const url = URL.createObjectURL(new Blob([action.content], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = action.path.split('/').pop()!; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (!(['edit', 'file'] as (string | undefined)[]).includes(action?.type)) input.current?.focus({ preventScroll: true });
  }
  function complete() {
    const matches = completeCommand(command, state);
    if (matches.length === 1) { setCommand(matches[0]); setCompletions([]); }
    else { setCompletions(matches.slice(0, 20)); setAnnouncement(matches.length ? `${matches.length} completions available.` : 'No matching files or commands.'); }
    input.current?.focus({ preventScroll: true });
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.altKey && event.key === 'ArrowRight') { event.preventDefault(); complete(); return; }
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); setState(previous => ({ ...previous, welcome: false, output: [] })); return; }
    if (event.ctrlKey && event.key.toLowerCase() === 'c' && input.current?.selectionStart === input.current?.selectionEnd) {
      event.preventDefault();
      if (running) stopProcess.current?.(); else { print(`guest@studio:${displayPath(state.cwd)}$ ${command}^C`); setCommand(''); }
      return;
    }
    if (!['ArrowUp', 'ArrowDown'].includes(event.key) || !state.history.length) return;
    event.preventDefault();
    if (historyIndex === null) draftCommand.current = command;
    const index = Math.max(0, Math.min(state.history.length, (historyIndex ?? state.history.length) + (event.key === 'ArrowUp' ? -1 : 1)));
    setHistoryIndex(index); setCommand(index === state.history.length ? draftCommand.current : state.history[index]);
  }
  function link(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('#') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigateTo(href);
  }
  const returnToTerminal = () => setState(previous => ({ ...previous, view: 'terminal' }));

  return <div className={`sandbox-workspace sandbox-computer sandbox-${state.theme} ${expanded ? 'is-expanded' : ''}`} onKeyDown={event => {
    if (event.key === 'Escape' && state.view !== 'file') { event.preventDefault(); event.stopPropagation(); if (running) stopProcess.current?.(); else if (state.view !== 'terminal') returnToTerminal(); else onClose(); }
  }}>
    <div className="computer-chrome"><div className="computer-lights"><button type="button" aria-label="Close computer" onClick={onClose} /><button type="button" aria-label={expanded ? 'Restore computer size' : 'Expand computer'} onClick={() => setExpanded(value => !value)} /></div><h3>{state.view === 'terminal' ? 'guest@studio: ' + displayPath(state.cwd) : state.view === 'file' ? 'edit — ' + displayPath(state.editor!.path) : 'HTML / CSS studio'}</h3><span className="computer-session">LOCAL SESSION</span></div>
    {state.view === 'terminal' ? <>
      <div className="computer-screen" ref={output} role="region" aria-label="Terminal history" tabIndex={0} onClick={event => { if (event.target === event.currentTarget && !window.getSelection()?.toString()) input.current?.focus(); }}>
        {state.welcome && <div className="computer-welcome"><pre aria-hidden="true">{'  ▄▀▀ ▀█▀ █ █ █▀▄ █ ▄▀▄\n  ▄██  █  ▀▄█ █▄▀ █ ▀▄▀'}</pre><p>Personal computer / browser edition</p><p className="computer-dim">Your own files. A text editor. JavaScript that runs.</p><p>Start with <button type="button" onClick={() => run('cat readme.txt')}>cat readme.txt</button> or <button type="button" onClick={() => run('help')}>help</button>.</p></div>}
        {state.output.map((entry, index) => <div className={`computer-entry ${entry.error ? 'is-error' : ''}`} key={index}>
          {entry.command !== undefined && <div className="computer-command"><span>guest@studio</span><b>:{displayPath(entry.cwd!)}$</b> {entry.command}</div>}
          {entry.listing?.length ? <div className="computer-listing">{entry.listing.map(item => <span key={item.name} className={item.directory ? 'is-directory' : ''}>{item.name}{item.directory ? '/' : ''}</span>)}</div> : entry.text && <pre>{entry.text}</pre>}
          {entry.links && <div className="sandbox-result-links">{entry.links.map(item => <a key={item.href} href={item.href} onClick={event => link(event, item.href)} {...(!item.href.startsWith('#') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.label}</a>)}</div>}
        </div>)}
        <form className="computer-prompt" onSubmit={event => { event.preventDefault(); run(command); }}><label htmlFor="sandbox-command"><span>guest@studio</span><b>:{displayPath(state.cwd)}$</b><span className="sandbox-sr-only"> Enter a command</span></label><input ref={input} id="sandbox-command" value={command} maxLength={limits.command} readOnly={running} onChange={event => { setCommand(event.target.value); setHistoryIndex(null); setCompletions([]); }} onKeyDown={keyboard} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="computer-keys" /><button type="submit" disabled={running} aria-label="Run command">↵</button></form>
        {running && <div className="computer-process" role="status">Running JavaScript… <button type="button" onClick={() => stopProcess.current?.()}>Stop process</button></div>}
        {completions.length > 0 && <div className="computer-completions" role="group" aria-label="Command completions">{completions.map(value => <button type="button" key={value} onClick={() => { setCommand(value); setCompletions([]); input.current?.focus(); }}>{value}</button>)}</div>}
      </div>
      <div className="computer-shortcuts" role="group" aria-label="Terminal shortcuts"><button type="button" onClick={() => run('help')}>help</button><button type="button" onClick={() => run('ls')}>ls</button><button type="button" onClick={() => run('edit hello.js')}>edit hello.js</button><button type="button" onClick={() => run('run hello.js')}>run hello.js</button><button type="button" onClick={() => run('edit postcard')}>studio <PhArrowUpRight aria-hidden="true" className="ph-icon" /></button><button type="button" onClick={complete}>Complete <span>Alt + →</span></button></div>
    </> : state.view === 'file' ? <SandboxFileEditor state={state} setState={setState} onReturn={returnToTerminal} /> : <><div className="computer-appbar"><button type="button" onClick={returnToTerminal}>← Return to terminal</button><span>Esc to return</span></div><SandboxPreview state={state} setState={setState} /></>}
    <div className="computer-statusbar"><span><i aria-hidden="true" />{state.persistence === 'local' ? 'Files saved in this browser' : 'Files saved for this session only'}</span><span id="computer-keys">↑↓ history · Ctrl+L clear · Ctrl+C stop</span></div>
    <span className="sandbox-sr-only" role="status">{announcement}</span>
  </div>;
}
