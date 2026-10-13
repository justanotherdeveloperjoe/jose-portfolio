import { useState } from 'react';
import { labTables } from '../../data/labTables.js';
import { runQuery } from '../../lib/miniSql.js';
import { CodeEditor } from './CodeEditor.jsx';

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

  function run() {
    try {
      setResult(runQuery(sql, labTables));
      setError('');
    } catch (problem) {
      setResult(null);
      setError(problem.message);
    }
  }
  function choose(name) {
    setPreset(name);
    setSql(queries[name]);
    setResult(null);
    setError('');
  }

  const summary = error ? `Couldn’t run that: ${error}` : result ? `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} · ${result.ms < 1 ? 'under 1' : Math.round(result.ms)} ms · from my real project list.` : '';
  return <div className="learning-scene lab-scene">
    <div className="lab-window">
      <div className="lab-bar"><span aria-hidden="true">● ● ●</span><span>projects.sql</span><span>SQL</span></div>
      <CodeEditor language="sql" value={sql} onChange={setSql} onRun={run} label="SQL query — edit it, then run it" />
      <div className="lab-output lab-results" data-state={error ? 'error' : result ? 'done' : 'empty'}>
        {error ? <div className="lab-line is-error"><span aria-hidden="true">✕</span>{error}</div>
          : result ? (result.rows.length ? <div className="lab-table-scroll"><table className="lab-table"><thead><tr>{result.columns.map((column, i) => <th key={i} scope="col">{column}</th>)}</tr></thead>
            <tbody>{result.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} className={cell === null ? 'is-null' : typeof cell === 'number' ? 'is-number' : undefined}>{cell === null ? 'NULL' : String(cell)}</td>)}</tr>)}</tbody></table></div>
            : <div className="lab-line is-hint"><span aria-hidden="true">›</span>No rows match. Loosen the WHERE and try again.</div>)
          : <div className="lab-line is-hint"><span aria-hidden="true">›</span>Tables: {tableList}</div>}
      </div>
    </div>
    <div className="lab-actions">
      <div className="lab-examples" role="group" aria-label="Try a query">{Object.keys(queries).map(name => <button key={name} type="button" aria-pressed={preset === name} onClick={() => choose(name)}>{name}</button>)}</div>
      <button type="button" className="lab-run" onClick={run}>Run query <span aria-hidden="true">▶</span></button>
    </div>
    <p className="scene-caption" role="status">{summary || 'Real queries, real answers: these are the projects on this site. Edit the SQL and run it.'}</p>
  </div>;
}
