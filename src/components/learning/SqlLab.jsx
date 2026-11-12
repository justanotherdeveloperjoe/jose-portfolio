import { X as PhX, Play as PhPlay } from '@phosphor-icons/react';
import { useState } from 'react';
import { labTables } from '../../data/labTables.js';
import { runQuery } from '../../lib/miniSql.js';
import { CodeEditor } from './CodeEditor.jsx';
import { downloadText, LabIntro } from './LabParts.jsx';
import { toCsv } from '../../lib/learningTasks.js';

const queries = {
  'Live sites': "SELECT name, category\nFROM projects\nWHERE status = 'live'\nORDER BY name;",
  'Count by status': 'SELECT status, COUNT(*) AS projects\nFROM projects\nGROUP BY status\nORDER BY projects DESC;',
  Search: "SELECT name, category\nFROM projects\nWHERE category LIKE '%fit%'\n   OR name LIKE '%allende%';",
};
const firstQuery = Object.keys(queries)[0];
const tableList = Object.entries(labTables).map(([name, table]) => `${name} (${table.columns.join(', ')})`).join(' · ');

// The SQL lab: real queries over my real projects, run by a small engine in the page (src/lib/miniSql.js).
export function SqlLab() {
  const [preset, setPreset] = useState(firstQuery);
  const [sql, setSql] = useState(queries[firstQuery]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [edited, setEdited] = useState(false);

  function run() {
    try {
      setResult(runQuery(sql, labTables));
      setError('');
      setEdited(false);
    } catch (problem) {
      setResult(null);
      setError(problem.message);
      setEdited(false);
    }
  }
  function choose(name) {
    setPreset(name);
    setSql(queries[name]);
    setResult(null);
    setError('');
    setEdited(false);
  }

  function findProjects(event) {
    event.preventDefault();
    const term = search.trim().replace(/'/g, "''");
    const query = `SELECT name, category, status\nFROM projects\nWHERE name LIKE '%${term}%'\n   OR category LIKE '%${term}%'\nORDER BY name;`;
    setPreset('');
    setSql(query);
    try { setResult(runQuery(query, labTables)); setError(''); setEdited(false); }
    catch (problem) { setResult(null); setError(problem.message); }
  }

  const summary = error ? `Couldn’t run that: ${error}` : result ? `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} · ${result.ms < 1 ? 'under 1' : Math.round(result.ms)} ms · from my real project list.` : '';
  return <div className="learning-scene lab-scene">
    <LabIntro title="Ask the data a better question.">Find a project, inspect the query, or write your own. These records come from this portfolio.</LabIntro>
    <div className="lab-window">
      <div className="lab-bar"><span aria-hidden="true"><span className="win-dots" aria-hidden="true"><i /><i /><i /></span></span><span>projects.sql</span><span>SQL</span></div>
      <CodeEditor language="sql" value={sql} onChange={value => { setSql(value); setEdited(true); setPreset(''); }} onRun={run} label="SQL query — edit it, then run it" />
      <div className="lab-output lab-results" data-state={error ? 'error' : result ? 'done' : 'empty'}>
        {error ? <div className="lab-line is-error"><span aria-hidden="true"><PhX aria-hidden="true" className="ph-icon" /></span>{error}</div>
          : result ? (result.rows.length ? <div className="lab-table-scroll"><table className="lab-table"><thead><tr>{result.columns.map((column, i) => <th key={i} scope="col">{column}</th>)}</tr></thead>
            <tbody>{result.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} className={cell === null ? 'is-null' : typeof cell === 'number' ? 'is-number' : undefined}>{cell === null ? 'NULL' : String(cell)}</td>)}</tr>)}</tbody></table></div>
            : <div className="lab-line is-hint"><span aria-hidden="true">›</span>No rows match. Loosen the WHERE and try again.</div>)
          : <div className="lab-line is-hint"><span aria-hidden="true">›</span>Tables: {tableList}</div>}
      </div>
    </div>
    <div className="lab-actions">
      <div className="lab-examples" role="group" aria-label="Try a query">{Object.keys(queries).map(name => <button key={name} type="button" aria-pressed={preset === name} onClick={() => choose(name)}>{name}</button>)}</div>
      <button type="button" className="lab-run" onClick={run}>Run query <span aria-hidden="true"><PhPlay aria-hidden="true" className="ph-icon" /></span></button>
    </div>
    <p className="scene-caption" role="status">{edited ? 'Query changed. Run it to refresh the results below the editor.' : summary || 'Real queries, real answers. Try a preset, or use the project finder below.'}</p>
    <div className="sql-tools">
      <form className="sql-filter-form" onSubmit={findProjects}><label className="task-field">Build a search query<input type="search" placeholder="Try Allende or fitness" value={search} maxLength={80} onChange={event => setSearch(event.target.value)} /></label><button type="submit">Find projects</button></form>
      <button type="button" className="sql-export" disabled={!result || edited} onClick={() => downloadText('project-query.csv', toCsv(result.columns, result.rows), 'text/csv')}>Export results</button>
      <details className="lab-reference"><summary>Tables & query guide</summary><dl>{Object.entries(labTables).map(([name, table]) => <div key={name}><dt>{name} · {table.rows.length} rows</dt><dd>{table.columns.join(' / ')}</dd></div>)}</dl><p>SELECT, WHERE, LIKE, GROUP BY, COUNT, ORDER BY, and LIMIT. This small local engine is read-only; JOINs aren’t supported here. Status “soon” means work in progress.</p><p>In the search field, % matches any text and _ matches one character.</p></details>
    </div>
  </div>;
}
