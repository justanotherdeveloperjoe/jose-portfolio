import { DesktopIcon } from './DesktopIcon.jsx';
import { DesktopWindow } from './DesktopWindow.jsx';
import { DesktopCalculator } from './DesktopCalculator.jsx';
import { DesktopCalendar } from './DesktopCalendar.jsx';
import { DesktopTimer } from './DesktopTimer.jsx';
import { DesktopSketchpad } from './DesktopSketchpad.jsx';

export const utilityApps = [
  { id: 'calculator', title: 'Calculator', description: 'A little everyday math.' },
  { id: 'calendar', title: 'Calendar', description: 'Dates and things to remember.' },
  { id: 'timer', title: 'Focus Timer', description: 'Make time for one thing.' },
  { id: 'sketchpad', title: 'Sketchpad', description: 'Give an idea some room.' },
];

export function DesktopUtilities({ windows, windowProps, openWindow, desktopActive, onNotify }) {
  return <>
    {windows.utilities.open && <DesktopWindow {...windowProps('utilities')}><div className="linux-utility linux-utilities"><div className="linux-app-heading"><div><span className="linux-eyebrow">Small tools, close at hand</span><h3>Your everyday kit.</h3></div></div><div className="linux-utilities-grid">{utilityApps.map(app => <button type="button" key={app.id} onClick={() => openWindow(app.id)}><DesktopIcon name={app.id} /><strong>{app.title}</strong><span>{app.description}</span>{windows[app.id].open && <small>Open <i aria-hidden="true" /></small>}</button>)}</div><p className="linux-utility-status">Pick a tool. Make a little something.</p></div></DesktopWindow>}
    {utilityApps.map(app => windows[app.id].mounted && <div key={app.id} hidden={!windows[app.id].open}><DesktopWindow {...windowProps(app.id)}>
      {app.id === 'calculator' && <DesktopCalculator />}
      {app.id === 'calendar' && <DesktopCalendar />}
      {app.id === 'timer' && <DesktopTimer desktopActive={desktopActive} onNotify={onNotify} />}
      {app.id === 'sketchpad' && <DesktopSketchpad />}
    </DesktopWindow></div>)}
  </>;
}
