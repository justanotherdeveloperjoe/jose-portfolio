const paths = {
  terminal: 'm5 7 5 5-5 5M13 17h6',
  files: 'M3 7V5h6l2 2h10v13H3V7Z',
  notes: 'M14 4H5v16h14v-9M10 14l1-4 8-8 3 3-8 8-4 1Z',
  monitor: 'M3 4h18v13H3V4ZM8 21h8M12 17v4M6 11h3l2-4 3 7 2-3h2',
  appearance: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h3a3 3 0 0 0 3-3 9 9 0 0 0-9-7ZM7 10h.01M9 6h.01M14 6h.01M17 9h.01',
  welcome: 'M9.5 8a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  center: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M8 8h8v8H8Z',
  maximize: 'M5 5h14v14H5Z',
  restore: 'M8 8V4h12v12h-4M4 8h12v12H4Z',
  close: 'm6 6 12 12M18 6 6 18',
  file: 'M14 3H5v18h14V8l-5-5ZM14 3v5h5M8 13h8M8 17h6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  utilities: 'M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z',
  calculator: 'M5 3h14v18H5ZM8 6h8v4H8ZM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
  calendar: 'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01',
  timer: 'M9 2h6M12 2v3M18 6l2-2M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM12 9v4l3 2',
  sketchpad: 'M16 3H4v18h16V11M9 15l1-4 9-9 3 3-9 9-4 1ZM16 5l3 3M7 18h9',
};

export function DesktopIcon({ name, className = '' }) {
  return <svg className={`linux-glyph ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.file} /></svg>;
}
