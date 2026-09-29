import { useEffect, useState } from 'react';

export function DesktopMonitor({ control, running }) {
  const [stats, setStats] = useState(null), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!running) return;
    let cancelled = false, timer;
    async function sample() {
      if (cancelled || document.hidden) return;
      try {
        const next = await control.current?.sample();
        if (!cancelled && next) { setStats(next); setError(''); }
      } catch (failure) { if (!cancelled) setError(failure.message); }
      if (!cancelled) timer = setTimeout(sample, 2500);
    }
    const visibility = () => { clearTimeout(timer); if (!document.hidden) timer = setTimeout(sample, 2500); };
    sample(); document.addEventListener('visibilitychange', visibility);
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [control, running, refresh]);
  const percent = stats ? Math.min(100, Math.round(stats.used / stats.total * 100)) : 0;
  return <div className="linux-monitor">
    <div className="linux-app-heading"><div><span className="linux-eyebrow">Inside this computer</span><h3>System Monitor</h3></div><span className={`linux-live ${running ? 'is-running' : ''}`}>{running ? 'Live' : 'Paused'}</span></div>
    <div className="linux-stat-grid"><div><span>Memory in use</span><strong>{stats ? `${(stats.used / 1024).toFixed(1)}` : '—'}<small> MB</small></strong><span>{stats ? `of ${(stats.total / 1024).toFixed(1)} MB usable` : 'Reading guest memory…'}</span><meter min="0" max="100" value={percent} aria-label="Guest memory usage">{percent}%</meter></div><div><span>Linux uptime</span><strong>{stats ? `${Math.floor(stats.seconds / 60)}:${String(Math.floor(stats.seconds % 60)).padStart(2, '0')}` : '—'}</strong><span>minutes : seconds</span><small>64 MB allocated · Linux 6.8</small></div></div>
    <div className="linux-process-heading"><h4>Running processes</h4><button type="button" disabled={!running} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    <pre className="linux-processes" tabIndex="0" aria-label="Linux process list">{stats?.processes || 'Waiting for Linux…'}</pre>
    <p className="linux-app-note" role="status">{error || (stats ? `Read from Linux /proc · updated ${new Date(stats.sampledAt).toLocaleTimeString()}` : 'Reading the running Linux session.')}</p>
  </div>;
}
