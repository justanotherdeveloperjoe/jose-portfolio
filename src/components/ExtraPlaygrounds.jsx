import { useState } from 'react';

const typeStyles = {
  Sans: "'Segoe UI', Arial, sans-serif",
  Serif: "Georgia, 'Times New Roman', serif",
  Mono: "'Cascadia Mono', Consolas, monospace",
};

export function TypographyPlayground() {
  const [family, setFamily] = useState('Sans');
  const [tracking, setTracking] = useState(-4);
  const [bold, setBold] = useState(true);

  return <article className="studio-lab-card studio-type-lab">
    <div className="studio-lab-heading"><span className="studio-kicker">Experiment 003</span><span>Type & personality</span></div>
    <h3>Same words.<br />Different voice.</h3>
    <div className="studio-type-stage" style={{ fontFamily: typeStyles[family], letterSpacing: `${tracking / 100}em`, fontWeight: bold ? 700 : 400 }} aria-label="Typography preview"><span>Make some</span><span>noise<span className="studio-type-period">.</span></span><span className="studio-type-baseline" aria-hidden="true" /></div>
    <div className="studio-type-controls"><div className="studio-lab-segment" role="group" aria-label="Typeface">{Object.keys(typeStyles).map(name => <button key={name} type="button" aria-pressed={family === name} onClick={() => setFamily(name)}>{name}</button>)}</div><button type="button" className="studio-type-weight" aria-pressed={bold} onClick={() => setBold(!bold)}>Bold</button></div>
    <label className="studio-extra-range" htmlFor="type-tracking">Letter spacing <output>{tracking > 0 ? '+' : ''}{tracking / 100} em</output><input id="type-tracking" type="range" min="-8" max="8" value={tracking} onChange={event => setTracking(Number(event.target.value))} /></label>
    <p className="studio-lab-caption">Switch the type. Change the spacing. Find your voice.</p>
  </article>;
}

const palettes = {
  Citrus: { accent: '#d5f77a', paper: '#edf0df', ink: '#26301b', night: '#20261b' },
  Clay: { accent: '#ffac85', paper: '#f2e4dc', ink: '#40261e', night: '#30221e' },
  Cobalt: { accent: '#accbff', paper: '#e6edf8', ink: '#1c3253', night: '#18283e' },
};

export function ThemePlayground() {
  const [palette, setPalette] = useState('Citrus');
  const [dark, setDark] = useState(false);
  const colors = palettes[palette];
  return <article className="studio-lab-card studio-theme-lab">
    <div className="studio-lab-heading"><span className="studio-kicker">Experiment 004</span><span>Color systems</span></div>
    <h3>A whole new mood.<br />One small switch.</h3>
    <div className={`studio-theme-stage ${dark ? 'is-night' : ''}`} style={{ '--preview-bg': dark ? colors.night : colors.paper, '--preview-ink': dark ? colors.paper : colors.ink, '--preview-accent': colors.accent, '--preview-button-ink': colors.ink }}>
      <div className="studio-theme-preview-top"><span>OFF HOURS®</span><span aria-hidden="true">↗</span></div><div className="studio-theme-preview-content"><div><span className="studio-theme-preview-title">Less rush.<br /><em>More room.</em></span><span className="studio-theme-sample-label">A little space for a slower day.</span></div><span className="studio-theme-orbit" aria-hidden="true"><i /><i /><i /></span></div><div className="studio-theme-preview-bottom"><span className="studio-theme-sample-button">Take a breath ↗</span><span className="studio-theme-sample-dots" aria-hidden="true"><i /><i /><i /></span></div>
    </div>
    <div className="studio-theme-controls"><div className="studio-lab-segment" role="group" aria-label="Color palette">{Object.entries(palettes).map(([name, colors]) => <button key={name} type="button" aria-pressed={palette === name} onClick={() => setPalette(name)}><i style={{ background: colors.accent }} aria-hidden="true" />{name}</button>)}</div><button type="button" className="studio-theme-mode" aria-label="Night mode" aria-pressed={dark} onClick={() => setDark(!dark)}><span aria-hidden="true">{dark ? '☾' : '☀'}</span>{dark ? 'Night' : 'Day'}</button></div>
    <div className="studio-theme-readout" aria-live="polite"><span>{palette} / {dark ? 'Night' : 'Day'}</span><span>{colors.accent.toUpperCase()}</span></div>
    <p className="studio-lab-caption">One layout, six looks. Color changes the conversation.</p>
  </article>;
}
