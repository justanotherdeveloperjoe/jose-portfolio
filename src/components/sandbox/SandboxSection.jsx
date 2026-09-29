import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import './SandboxSection.css';

const Workspace = lazy(() => import('./LinuxDesktop.jsx'));

class WorkspaceBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    // Browsers cache failed module imports. Reloading also refreshes stale asset
    // URLs after a deployment; recreating React.lazy alone cannot recover them.
    return this.state.failed ? <div className="sandbox-loading" role="alert"><p>The workspace could not load. Reload the page to try again.</p><button type="button" onClick={() => { window.history.replaceState(null, '', '#sandbox'); window.location.reload(); }}>Reload page ↗</button></div> : this.props.children;
  }
}

export function SandboxSection({ onArcade }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const session = useRef(null);
  const launch = useRef(null);
  function close() { setOpen(false); launch.current?.focus({ preventScroll: true }); }

  return <section id="sandbox" className="sandbox-section studio-wrap" aria-labelledby="sandbox-title">
    <div className="sandbox-heading">
      <div><span className="studio-kicker">05 / The sandbox</span><h2 id="sandbox-title">A little room to<br /><em>figure things out.</em></h2></div>
      <p>Explore my projects, see what I’m learning, or change a few lines and make something your own.</p>
    </div>
    <div className={`sandbox-invitation ${open ? 'is-open' : ''}`}>
      <div className="sandbox-invitation-copy"><span className="sandbox-symbol" aria-hidden="true">&gt;_</span><div><h3>Your little Linux desktop.</h3><p>A real terminal. A few windows. Room to explore.</p></div></div>
      <div className="sandbox-peek" aria-hidden="true"><span>Your files. Your tools. Your desktop.</span><span>Loads on open · about 13 MB</span></div>
      <button ref={launch} className="sandbox-launch" type="button" aria-expanded={open} aria-controls="sandbox-panel" onClick={() => { if (open) close(); else { setMounted(true); setOpen(true); } }}>{open ? 'Close desktop' : 'Open desktop'} <span aria-hidden="true">{open ? '−' : '↗'}</span></button>
    </div>
    <div id="sandbox-panel" className={`sandbox-panel ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open ? '' : undefined}>
      <div className="sandbox-panel-inner">{mounted && <WorkspaceBoundary><Suspense fallback={<div className="sandbox-loading" role="status">Starting your workspace…</div>}><Workspace session={session} onClose={close} onArcade={onArcade} active={open} /></Suspense></WorkspaceBoundary>}</div>
    </div>
    <div className="sandbox-footnote"><span>Small experiments. Yours to change.</span><span>Made with curiosity ↗</span></div>
  </section>;
}
