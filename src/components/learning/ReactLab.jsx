import { useState } from 'react';
import { projects } from '../../data/projects.js';
import { AtomMark, LabIntro } from './LabParts.jsx';

export function ReactLab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState([]);
  const [onlySaved, setOnlySaved] = useState(false);
  const visible = projects.filter(project =>
    `${project.name} ${project.category}`.toLowerCase().includes(search.toLowerCase().trim())
    && (filter === 'all' || project.status === filter)
    && (!onlySaved || saved.includes(project.id)));
  function toggle(id) { setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function reset() { setSearch(''); setFilter('all'); setSaved([]); setOnlySaved(false); }

  return <div className="learning-scene react-lab">
    <LabIntro title="An interface that responds.">Search my projects and save a few. Shared state keeps the list and your shortlist in sync.</LabIntro>
    <div className="task-window">
      <div className="task-masthead"><div><span className="task-eyebrow">COMPONENT STUDY</span><strong>A small project finder</strong></div><AtomMark /></div>
      <div className="task-fields">
        <label className="task-field">Find a project<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or industry" maxLength={100} /></label>
        <div className="task-field"><label htmlFor="learning-project-status">Show</label><select id="learning-project-status" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All projects</option><option value="live">Live websites</option><option value="soon">In progress</option></select></div>
      </div>
      <div className="project-finder-toolbar"><span role="status">{visible.length} of {projects.length} projects</span><button type="button" aria-pressed={onlySaved} onClick={() => setOnlySaved(value => !value)}>Saved ({saved.length})</button></div>
      <ul className="project-finder-list" aria-label="Matching projects">
        {visible.map(project => <li key={project.id}>
          <div><strong>{project.name}</strong><span>{project.category} · {project.status === 'live' ? 'Live' : 'In progress'}</span></div>
          <button type="button" aria-pressed={saved.includes(project.id)} aria-label={`${saved.includes(project.id) ? 'Unsave' : 'Save'} ${project.name}`} onClick={() => toggle(project.id)}><span aria-hidden="true">{saved.includes(project.id) ? '✓' : '+'}</span></button>
        </li>)}
        {!visible.length && <li className="task-empty">{onlySaved ? 'No saved projects match. Save a project or adjust your filters.' : 'No matches yet. Try another name or industry.'}</li>}
      </ul>
      <div className="component-readout"><span>STATE → RENDER</span><code>filter: {filter} · saved: {saved.length} · visible: {visible.length}</code></div>
    </div>
    <div className="lab-actions"><span className="task-footnote">Search + filters → shared state → project list</span><button type="button" onClick={reset}>Reset demo</button></div>
    <p className="scene-caption">Real React state, using this portfolio’s project list. Your shortlist stays here while you explore the tabs.</p>
  </div>;
}
