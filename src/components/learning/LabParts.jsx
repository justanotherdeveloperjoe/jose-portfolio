export function LabIntro({ title, children }) {
  return <div className="lab-intro"><strong>{title}</strong><p>{children}</p></div>;
}

export function downloadText(name, contents, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([contents], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AtomMark() {
  return <svg className="lab-mark" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">{[0, 60, 120].map(angle => <ellipse key={angle} cx="32" cy="32" rx="27" ry="10" transform={`rotate(${angle} 32 32)`} />)}<circle cx="32" cy="32" r="4" fill="currentColor" /></svg>;
}

export function BotMark({ done }) {
  return <svg className="lab-mark" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M32 17V9m-19 22H8m48 0h-5" /><circle cx="32" cy="7" r="2" /><rect x="13" y="17" width="38" height="32" rx="10" /><circle cx="24" cy="29" r="2" fill="currentColor" /><circle cx="40" cy="29" r="2" fill="currentColor" /><path d={done ? 'm24 37 6 5 11-8' : 'M25 40h14'} /><path d="M23 49v8m18-8v8" /></svg>;
}
