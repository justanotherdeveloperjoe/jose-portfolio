import { ArrowUpRight as PhArrowUpRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { prepareAssets, sampleAssetNames, toCsv } from '../../lib/learningTasks.js';
import { BotMark, downloadText, LabIntro } from './LabParts.jsx';

const pythonReference = `# The naming step in Python
import re, unicodedata

def slug(stem):
    ascii_name = unicodedata.normalize("NFKD", stem)
    ascii_name = ascii_name.encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-") or "asset"`;

export function PythonLab() {
  const [input, setInput] = useState(sampleAssetNames);
  const [cleanNames, setCleanNames] = useState(true);
  const [groupByType, setGroupByType] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  function clearResult() { setResult(null); setError(''); }
  function run(event) {
    event.preventDefault();
    try { setResult(prepareAssets(input, { cleanNames, groupByType })); setError(''); }
    catch (problem) { setResult(null); setError(problem.message); }
  }
  function reset() { setInput(sampleAssetNames); setCleanNames(true); setGroupByType(true); clearResult(); }
  return <div className="learning-scene python-lab">
    <LabIntro title="Give the repetitive work to a script.">Turn a messy list of website assets into tidy filenames and folders.</LabIntro>
    <form className="task-window" onSubmit={run}>
      <div className="task-masthead"><div><span className="task-eyebrow">AUTOMATION STUDY</span><strong>A little asset assistant</strong></div><BotMark done={!!result} /></div>
      <label className="task-field">Filenames · one per line<textarea value={input} rows={5} maxLength={4000} spellCheck={false} onChange={event => { setInput(event.target.value); clearResult(); }} aria-describedby="asset-input-hint" /></label>
      <p className="task-footnote" id="asset-input-hint">Try your own list. Up to 50 names; your files stay untouched.</p>
      <div className="task-options"><label><input type="checkbox" checked={cleanNames} onChange={event => { setCleanNames(event.target.checked); clearResult(); }} /> Clean names</label><label><input type="checkbox" checked={groupByType} onChange={event => { setGroupByType(event.target.checked); clearResult(); }} /> Group by type</label></div>
      <button type="submit" className="lab-run">Prepare assets <span aria-hidden="true"><PhArrowUpRight aria-hidden="true" className="ph-icon" /></span></button>
      {result && <div className="asset-result"><span className="task-eyebrow">PROPOSED PATHS · DUPLICATES NUMBERED</span><ul aria-label="Prepared assets">{result.map((file, i) => <li key={i}><span>{file.original}</span><code>{file.path}</code></li>)}</ul></div>}
      <p className={`task-status ${error ? 'has-error' : ''}`} role="status">{error || (result ? `${result.length} filenames prepared. Download the mapping or change a name and run again.` : 'Sample names ready. The assistant will make a before-and-after mapping.')}</p>
    </form>
    <div className="lab-actions"><button type="button" disabled={!result} onClick={() => downloadText('asset-mapping.csv', toCsv(['original', 'path'], result.map(file => [file.original, file.path])), 'text/csv')}>Download mapping</button><button type="button" onClick={reset}>Reset demo</button></div>
    <details className="lab-reference"><summary>See the Python naming pattern</summary><pre>{pythonReference}</pre></details>
    <p className="scene-caption">A Python automation idea, simulated in this browser with JavaScript. The snippet shows the naming step; this isn’t a Python interpreter.</p>
  </div>;
}
