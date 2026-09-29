import { useCallback, useEffect, useRef, useState } from 'react';
import V86 from 'v86';
import wasmURL from 'v86/build/v86.wasm?url';
import fallbackURL from 'v86/build/v86-fallback.wasm?url';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { DesktopWindow } from './DesktopWindow.jsx';
import { DesktopIcon } from './DesktopIcon.jsx';
import { DesktopMonitor } from './DesktopMonitor.jsx';
import { DesktopUtilities, utilityApps } from './DesktopUtilities.jsx';
import { DesktopAppearance, accents, loadAppearance } from './DesktopAppearance.jsx';
import { createGuestControl, startGuestControl } from './guestControl.js';
import { listFiles, saveNote } from './linuxFiles.js';
import { learningTopics } from '../../data/learning.js';
import { projects } from '../../data/projects.js';
import './LinuxDesktop.css';
import './DesktopPolish.css';
import './DesktopUtilities.css';

const titles = { terminal: 'Terminal', files: 'Files', notes: 'Notes', monitor: 'Monitor', appearance: 'Appearance', welcome: 'Welcome', utilities: 'Utilities', ...Object.fromEntries(utilityApps.map(app => [app.id, app.title])) };
const dockApps = ['terminal', 'files', 'notes', 'monitor', 'appearance', 'utilities'];
const startWindows = { terminal: { x: 56, y: 44, z: 2, open: true }, files: { x: 140, y: 80, z: 3, open: false }, notes: { x: 180, y: 60, z: 4, open: false }, welcome: { x: 100, y: 50, z: 5, open: false }, monitor: { x: 200, y: 48, z: 6, open: false }, appearance: { x: 240, y: 65, z: 7, open: false }, utilities: { x: 100, y: 32, z: 8, open: false }, ...Object.fromEntries(utilityApps.map((app, index) => [app.id, { x: 150 + index * 24, y: 24 + index * 8, z: 9 + index, open: false, mounted: false }])) };
const enc = new TextEncoder();

export default function LinuxDesktop({ active, onClose, onArcade }) {
  const [status, setStatus] = useState('Downloading Linux…');
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [windows, setWindows] = useState(startWindows);
  const [front, setFront] = useState('terminal');
  const [folder, setFolder] = useState('/');
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState({ path: 'notes.txt', content: '', dirty: false });
  const [message, setMessage] = useState('');
  const [restart, setRestart] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [appearance, setAppearance] = useState(loadAppearance);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  const vm = useRef(null), terminal = useRef(null), fit = useRef(null), container = useRef(null), desktop = useRef(null), top = useRef(12), control = useRef(null);
  const appearanceRef = useRef(appearance);
  appearanceRef.current = appearance;
  const activeRef = useRef(active), pausedRef = useRef(paused), folderRef = useRef(folder), noteRef = useRef(note), booted = useRef(false);
  activeRef.current = active; pausedRef.current = paused; folderRef.current = folder; noteRef.current = note;

  const focusWindow = useCallback(id => { setFront(id); setWindows(previous => previous[id].z === top.current ? previous : { ...previous, [id]: { ...previous[id], z: ++top.current } }); }, []);
  const openWindow = id => { setWindows(previous => ({ ...previous, [id]: { ...previous[id], open: true, mounted: true, z: ++top.current } })); setFront(id); };
  // The VM object exists as soon as V86 is constructed, but its inner machine and
  // 9p filesystem are only wired up asynchronously once the WASM module has loaded
  // and `emulator-ready` has fired. Calling run()/stop()/fs9p methods before that
  // throws, so every VM call outside that handler must check `booted` first.
  const refresh = useCallback(() => {
    if (!vm.current || !booted.current) return;
    try { setEntries(listFiles(vm.current, folderRef.current)); }
    catch (error) {
      setMessage(error.message); setFolder('/'); folderRef.current = '/';
      try { setEntries(listFiles(vm.current, '/')); } catch { setEntries([]); }
    }
  }, []);

  useEffect(() => {
    let disposed = false, emulator, observer, input, resize, bootTimer, flushTimer, fileTimer;
    let pending = [], bootText = '', initializing = false;
    booted.current = false;
    setReady(false); setFailed(false); setPaused(false); pausedRef.current = false;
    setStatus('Downloading Linux…');
    const term = new Terminal({ cursorBlink: !matchMedia('(prefers-reduced-motion: reduce)').matches, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: appearanceRef.current.fontSize, lineHeight: 1.3, scrollback: 1500, convertEol: false, screenReaderMode: true, theme: { background: '#171b17', foreground: '#e9e8df', cursor: accents[appearanceRef.current.accent], selectionBackground: '#455044', green: '#d5f77a', brightGreen: '#e5ffa7' } });
    const addon = new FitAddon(); term.loadAddon(addon); term.open(container.current); terminal.current = term; fit.current = addon; addon.fit();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { term.options.cursorBlink = !motion.matches; };
    motion.addEventListener('change', updateMotion);
    term.writeln('\x1b[38;2;213;247;122mStarting your little Linux computer…\x1b[0m');
    const fail = text => { if (disposed) return; setStatus(text); setFailed(true); if (booted.current) emulator?.stop().catch(() => {}); };
    try {
      emulator = new V86({ wasm_path: wasmURL, wasm_fallback_path: fallbackURL, memory_size: 64 * 1024 * 1024, vga_memory_size: 2 * 1024 * 1024, bios: { url: '/linux/seabios.bin' }, vga_bios: { url: '/linux/vgabios.bin' }, bzimage: { url: '/linux/buildroot-bzimage68.bin' }, filesystem: {}, uart1: true, cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on', autostart: false, disable_keyboard: true, disable_mouse: true, disable_speaker: true });
      vm.current = emulator;
      control.current = createGuestControl(emulator);
      emulator.add_listener('download-progress', progress => {
        if (!disposed && progress.total) setStatus(`Loading Linux · ${Math.round(progress.loaded / progress.total * 100)}%`);
      });
      emulator.add_listener('download-error', () => fail('Linux could not download. Try restarting.'));
      emulator.add_listener('emulator-ready', async () => {
        booted.current = true;
        if (disposed) { emulator.destroy().catch(() => {}); return; }
        try {
          const initial = {
            'readme.txt': 'Welcome to Jose\'s Linux desktop.\n\nThis is a real Linux 6.8 guest with BusyBox utilities.\nTry: uname -a, ls, pwd, echo, cat, grep, vi, or sh hello.sh.\n\nFiles and Notes share /mnt with the terminal.\nCreate a file: echo "my first note" > /mnt/idea.txt\nThen open Files and select Refresh.\n\nClosing pauses this computer. Reloading the page resets it.\nDownload files you want to keep. Networking is disabled.\n',
            'notes.txt': 'A place for your next idea.\n',
            'hello.sh': '#!/bin/sh\necho "Hello from a real Linux shell."\necho "Here is what I am learning:"\ncat /mnt/learning.txt\n',
            'learning.txt': learningTopics.map(topic => `${topic.name}: ${topic.topics.join(', ')}`).join('\n') + '\n',
            'projects.txt': projects.map(project => `${project.name}\n${project.blurb}\n${project.url || 'In progress'}\n`).join('\n'),
          };
          for (const [path, content] of Object.entries(initial)) await emulator.create_file(path, enc.encode(content));
          if (disposed) return;
          setStatus('Booting Linux…');
          if (activeRef.current && !document.hidden) await emulator.run();
          refresh();
        } catch { fail('Linux could not start. Try restarting.'); }
      });
      emulator.add_listener('serial0-output-byte', byte => {
        if (disposed) return;
        pending.push(byte);
        if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; term.write(new Uint8Array(pending)); pending = []; }, 16);
        if (!initializing) {
          bootText = (bootText + String.fromCharCode(byte)).slice(-512);
          if (bootText.endsWith('~% ')) {
            initializing = true;
            emulator.serial0_send(startGuestControl + "\ncd /mnt; export HOME=/mnt TERM=xterm-256color; PS1='linux:\\w$ '; stty cols " + term.cols + ' rows ' + term.rows + "; clear; printf 'Welcome to your Linux desktop.\\nFiles and Notes share /mnt. Try: sh hello.sh\\n\\n'\n");
            clearTimeout(bootTimer); setReady(true); setStatus('Linux 6.8 · ready');
          }
        }
      });
      emulator.add_listener('9p-write-end', () => { clearTimeout(fileTimer); fileTimer = setTimeout(refresh, 250); });
      input = term.onData(data => { if (activeRef.current && !pausedRef.current) emulator.serial0_send(data); });
      resize = term.onResize(({ cols, rows }) => { if (initializing && activeRef.current && !pausedRef.current) control.current?.resize(cols, rows); });
      // Resize the renderer without injecting shell commands into a visitor's input.
      observer = new ResizeObserver(() => { if (container.current?.offsetWidth) addon.fit(); }); observer.observe(container.current);
      bootTimer = setTimeout(() => { if (!initializing && activeRef.current) fail('Linux is taking longer than expected. Try restarting.'); }, 60000);
    } catch { fail('This browser could not start the Linux emulator.'); }
    const visibility = () => {
      if (!emulator || !booted.current) return;
      if (document.hidden) emulator.stop();
      else if (activeRef.current && !pausedRef.current) emulator.run();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true; clearTimeout(bootTimer); clearTimeout(flushTimer); clearTimeout(fileTimer);
      document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', updateMotion);
      input?.dispose(); resize?.dispose(); observer?.disconnect(); term.dispose();
      control.current?.dispose(); control.current = null;
      if (booted.current) emulator?.destroy().catch(() => {});
      vm.current = null;
    };
  }, [restart, refresh]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!vm.current || !booted.current) return;
    if (!active || paused || document.hidden) vm.current.stop(); else vm.current.run();
    if (active) requestAnimationFrame(() => { fit.current?.fit(); });
  }, [active, paused]);
  useEffect(refresh, [folder, refresh]);
  useEffect(() => {
    try { localStorage.setItem('studio-linux-appearance', JSON.stringify(appearance)); } catch { /* Browser storage is optional. */ }
    if (terminal.current) {
      terminal.current.options.fontSize = appearance.fontSize;
      terminal.current.options.theme = { ...terminal.current.options.theme, cursor: accents[appearance.accent] };
      if (active && windows.terminal.open) fit.current?.fit();
    }
  }, [appearance, active, windows.terminal.open]);
  useEffect(() => { if (windows.terminal.open && active) requestAnimationFrame(() => fit.current?.fit()); }, [windows, active]);

  async function openFile(entry) {
    if (entry.directory) { setFolder(entry.path); return; }
    if (noteRef.current.dirty) { setMessage('Save or discard your open note before opening another file.'); openWindow('notes'); return; }
    try {
      if (entry.size > 128 * 1024) throw new Error('This file is too large for Notes. Download it or use the terminal.');
      const data = await vm.current.read_file(entry.path.replace(/^\//, ''));
      const content = new TextDecoder('utf-8', { fatal: true }).decode(data);
      setNote({ path: entry.path.replace(/^\//, ''), content, dirty: false }); setMessage(''); openWindow('notes');
    } catch (error) { setMessage(error.message); }
  }
  async function save() {
    try { await saveNote(vm.current, note.path, note.content); setNote(previous => ({ ...previous, dirty: false })); setMessage('Saved in Linux.'); refresh(); }
    catch (error) { setMessage(error.message); }
  }
  async function download(entry) {
    try {
      const data = await vm.current.read_file(entry.path.replace(/^\//, ''));
      const url = URL.createObjectURL(new Blob([data])); const link = document.createElement('a'); link.href = url; link.download = entry.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMessage('This file could not be downloaded.'); }
  }
  function closeWindow(id) {
    if (id === 'notes' && note.dirty) { setMessage('Save or discard your changes before closing Notes.'); return; }
    setWindows(previous => ({ ...previous, [id]: { ...previous[id], open: false } }));
    if (front === id) setFront(Object.keys(windows).filter(key => key !== id && windows[key].open).sort((a, b) => windows[b].z - windows[a].z)[0] || null);
  }
  const move = (id, position) => setWindows(previous => ({ ...previous, [id]: { ...previous[id], ...position } }));
  const windowProps = id => ({ id, title: titles[id], position: windows[id], front: front === id, onFocus: () => focusWindow(id), onMove: move, onClose: () => closeWindow(id), maximized: windows[id].maximized, onMaximize: () => setWindows(previous => ({ ...previous, [id]: { ...previous[id], maximized: !previous[id].maximized } })) });
  const dockOpen = id => windows[id].open || (id === 'utilities' && utilityApps.some(app => windows[app.id].open));
  const dockActive = id => front === id || (id === 'utilities' && utilityApps.some(app => app.id === front));

  return <div className="linux-desktop" ref={desktop} style={{ '--linux-accent': accents[appearance.accent] }}>
    <div className="linux-topbar"><span className="linux-brand"><i aria-hidden="true" />Studio OS<span> / Linux desktop</span></span><div><span className="linux-clock">{clock}</span><span role="status">{!active || paused ? 'Paused' : status}</span><button type="button" aria-label="Desktop help" onClick={() => openWindow('welcome')}><DesktopIcon name="welcome" /></button><button type="button" disabled={!ready} onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button><button type="button" onClick={onClose}>Close</button></div></div>
    <div className={`linux-screen linux-scene-${appearance.wallpaper}`}>
      <div className="linux-wallpaper" aria-hidden="true"><b>STUDIO OS 26.04</b></div>
      <div hidden={!windows.terminal.open}><DesktopWindow {...windowProps('terminal')}><div className="linux-terminal" ref={container} />{front === 'terminal' && <div className="linux-terminal-keys">{[['Ctrl+C', '\x03'], ['Tab', '\t'], ['Esc', '\x1b']].map(([label, data]) => <button type="button" key={label} disabled={!ready || paused || !active} onClick={() => { vm.current?.serial0_send(data); terminal.current?.focus(); }}>{label}</button>)}<span>/mnt · shared with Files</span></div>}</DesktopWindow></div>
      {windows.files.open && <DesktopWindow {...windowProps('files')}><div className="linux-files-toolbar"><button type="button" disabled={folder === '/'} onClick={() => setFolder(folder.slice(0, folder.lastIndexOf('/')) || '/')}>↑ Up</button><span>/mnt{folder === '/' ? '' : folder}</span><button type="button" onClick={refresh}>Refresh</button></div><div className="linux-file-list">{entries.map(entry => <div key={entry.path}><button type="button" onClick={() => openFile(entry)}><DesktopIcon name={entry.directory ? 'files' : 'file'} /><b>{entry.name}</b><small>{entry.directory ? 'Folder' : `${entry.size} B`}</small></button>{!entry.directory && <button type="button" aria-label={`Download ${entry.name}`} onClick={() => download(entry)}><DesktopIcon name="download" /></button>}</div>)}{!entries.length && <p>This folder is empty. Create a file in the terminal.</p>}</div><p className="linux-app-note">These are the Linux files in /mnt. Use Refresh after creating folders.</p></DesktopWindow>}
      {windows.notes.open && <DesktopWindow {...windowProps('notes')}><div className="linux-notes-toolbar"><label htmlFor="linux-note-name">/mnt/<input id="linux-note-name" value={note.path} onChange={event => setNote(previous => ({ ...previous, path: event.target.value, dirty: true }))} /></label><button type="button" onClick={save}>Save{note.dirty ? ' *' : ''}</button></div><label className="linux-sr-only" htmlFor="linux-note">Note contents</label><textarea id="linux-note" value={note.content} spellCheck={false} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 's') { event.preventDefault(); save(); } }} onChange={event => { if (enc.encode(event.target.value).length <= 128 * 1024) setNote(previous => ({ ...previous, content: event.target.value, dirty: true })); else setMessage('Notes limit: 128 KB.'); }} /><div className="linux-notes-footer"><span>Ctrl+S to save · files last until page reload</span><button type="button" onClick={() => { setNote({ path: 'notes.txt', content: '', dirty: false }); setMessage('Changes discarded. Reopen a file from Files to read it.'); }}>Discard changes</button></div></DesktopWindow>}
      {windows.monitor.open && <DesktopWindow {...windowProps('monitor')}><DesktopMonitor key={restart} control={control} running={ready && active && !paused && !failed} /></DesktopWindow>}
      {windows.appearance.open && <DesktopWindow {...windowProps('appearance')}><DesktopAppearance value={appearance} onChange={setAppearance} /></DesktopWindow>}
      <DesktopUtilities windows={windows} windowProps={windowProps} openWindow={openWindow} desktopActive={active && !paused && !failed && !confirmReset} onNotify={setMessage} />
      {windows.welcome.open && <DesktopWindow {...windowProps('welcome')}><div className="linux-welcome"><span className="linux-eyebrow">A little computer inside a website</span><h3>Make yourself<br /><em>at home.</em></h3><p>This desktop runs real Linux. Drag a window by its title bar, open an app from the dock, or try a few shell commands.</p><pre>uname -a{'\n'}ls /mnt{'\n'}sh /mnt/hello.sh{'\n'}echo "hello" &gt; /mnt/idea.txt</pre><p>Files and Notes share <code>/mnt</code> with the terminal. Download anything you want to keep. Closing pauses your session; reloading starts fresh. Networking is off.</p><button type="button" onClick={onArcade}>Visit the arcade ↗</button><button type="button" onClick={() => setConfirmReset(true)}>Restart Linux…</button><a href="/linux/NOTICE.txt" target="_blank" rel="noreferrer">Open-source credits ↗</a></div></DesktopWindow>}
      {(paused || failed) && <div className="linux-overlay"><h3>{failed ? 'A little trouble starting.' : 'Your computer is paused.'}</h3><p>{failed ? status : 'Your windows and files are right where you left them.'}</p><button type="button" onClick={() => failed ? setConfirmReset(true) : setPaused(false)}>{failed ? 'Restart Linux' : 'Resume Linux'}</button></div>}
      {confirmReset && <div className="linux-overlay" role="alertdialog" aria-modal="false" aria-label="Restart Linux"><h3>Start a fresh session?</h3><p>This clears the Linux files in this session. Download anything you want to keep first.</p><div><button type="button" onClick={() => setConfirmReset(false)}>Keep working</button><button type="button" onClick={() => { setConfirmReset(false); setNote({ path: 'notes.txt', content: '', dirty: false }); setRestart(value => value + 1); }}>Restart and clear files</button></div></div>}
    </div>
    <div className="linux-taskbar"><nav className="linux-dock" aria-label="Desktop applications">{dockApps.map(id => <button type="button" key={id} className={dockOpen(id) ? 'is-open' : ''} aria-pressed={dockActive(id) && dockOpen(id)} disabled={['files', 'notes', 'monitor'].includes(id) && !ready} onClick={() => { if (id === 'notes' && !note.content && !note.dirty) openFile({ path: '/notes.txt', name: 'notes.txt', size: 0 }); else openWindow(id); }}><DesktopIcon name={id} /><span>{titles[id]}</span></button>)}</nav></div>
    <p className="linux-message" role="status">{message || 'A real Linux session. Yours to explore.'}</p>
  </div>;
}
