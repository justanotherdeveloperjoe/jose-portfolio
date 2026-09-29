import { useState } from 'react';
import { calendarDays, dateKey } from './utilityMath.js';

const storageKey = 'studio-linux-reminders';
function readReminders() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && typeof item.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.text === 'string' && item.text.length <= 160).slice(0, 100);
  } catch { return []; }
}

export function DesktopCalendar() {
  const [today, setToday] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(today)), [reminders, setReminders] = useState(readReminders), [draft, setDraft] = useState(''), [message, setMessage] = useState('');
  const days = calendarDays(month.getFullYear(), month.getMonth());
  function save(next) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setMessage('Saved in this browser.'); }
    catch { setMessage('Browser storage is unavailable. Reminders will last for this visit.'); }
    setReminders(next);
  }
  function add(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    if (reminders.length >= 100) { setMessage('You have 100 reminders. Remove one before adding another.'); return; }
    save([...reminders, { id: crypto.randomUUID(), date: selected, text: draft.trim() }]); setDraft('');
  }
  function select(date) { setSelected(dateKey(date)); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return <div className="linux-utility linux-calendar">
    <div className="linux-month-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><h3 aria-live="polite">{title}</h3><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
    <div className="linux-calendar-week" aria-hidden="true">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={index}>{day}</span>)}</div>
    <div className="linux-calendar-days" role="group" aria-label={title}>{days.map(day => {
      const key = dateKey(day), hasReminder = reminders.some(item => item.date === key);
      return <button type="button" key={key} aria-label={day.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + (hasReminder ? ', has reminders' : '')} aria-pressed={selected === key} aria-current={key === dateKey(today) ? 'date' : undefined} className={`${day.getMonth() !== month.getMonth() ? 'is-other-month' : ''} ${hasReminder ? 'has-reminder' : ''}`} onClick={() => select(day)}>{day.getDate()}</button>;
    })}</div>
    <button type="button" className="linux-calendar-today" onClick={() => { const now = new Date(); setToday(now); select(now); }}>Back to today</button>
    <div className="linux-reminders"><h4>{new Date(selected + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} <span> / Reminders</span></h4>
      <ul>{reminders.filter(item => item.date === selected).map(item => <li key={item.id}><span>{item.text}</span><button type="button" aria-label={`Remove reminder: ${item.text}`} onClick={() => save(reminders.filter(entry => entry.id !== item.id))}>×</button></li>)}</ul>
      <form onSubmit={add}><label className="linux-sr-only" htmlFor="linux-reminder">New reminder</label><input id="linux-reminder" maxLength={160} value={draft} onChange={event => setDraft(event.target.value)} placeholder="A small thing to remember…" /><button type="submit" className="linux-primary" disabled={!draft.trim()}>Add</button></form>
    </div>
    <p className="linux-utility-status" role="status">{message || 'Personal reminders, saved here. No notifications.'}</p>
  </div>;
}
