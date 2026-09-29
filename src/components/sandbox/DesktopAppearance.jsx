export const defaultAppearance = { wallpaper: 'forest', accent: 'lime', fontSize: 13 };
export const accents = { lime: '#d5f77a', sage: '#adc8b4', sand: '#e7c58e' };
export function loadAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem('studio-linux-appearance')) || {};
    return { wallpaper: ['forest', 'dusk', 'graphite'].includes(saved.wallpaper) ? saved.wallpaper : 'forest', accent: Object.hasOwn(accents, saved.accent) ? saved.accent : 'lime', fontSize: [12, 13, 14, 15, 16, 17, 18].includes(saved.fontSize) ? saved.fontSize : 13 };
  } catch { return defaultAppearance; }
}

export function DesktopAppearance({ value, onChange }) {
  return <div className="linux-appearance">
    <div className="linux-app-heading"><div><span className="linux-eyebrow">A space of your own</span><h3>Appearance</h3></div></div>
    <fieldset><legend>Wallpaper</legend><div className="linux-wallpaper-options">{['forest', 'dusk', 'graphite'].map(name => <label key={name}><input type="radio" name="linux-wallpaper" value={name} checked={value.wallpaper === name} onChange={() => onChange({ ...value, wallpaper: name })} /><span className={`linux-wallpaper-preview linux-scene-${name}`} /><span>{name[0].toUpperCase() + name.slice(1)}</span></label>)}</div></fieldset>
    <fieldset><legend>Accent color</legend><div className="linux-accent-options">{Object.entries(accents).map(([name, color]) => <label key={name}><input type="radio" name="linux-accent" value={name} checked={value.accent === name} onChange={() => onChange({ ...value, accent: name })} /><span style={{ background: color }} /><span>{name[0].toUpperCase() + name.slice(1)}</span></label>)}</div></fieldset>
    <label className="linux-font-setting" htmlFor="linux-font-size"><span>Terminal text size <output>{value.fontSize} px</output></span><input id="linux-font-size" type="range" min="12" max="18" step="1" value={value.fontSize} onChange={event => onChange({ ...value, fontSize: Number(event.target.value) })} /></label>
    <div className="linux-type-preview" style={{ fontSize: value.fontSize }}><span>linux:~%</span> make yourself at home<span className="linux-preview-cursor" /></div>
    <div className="linux-settings-footer"><span>Saved in this browser.</span><button type="button" onClick={() => onChange({ ...defaultAppearance })}>Restore defaults</button></div>
  </div>;
}
