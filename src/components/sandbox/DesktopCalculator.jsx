import { useRef, useState } from 'react';
import { calculate } from './utilityMath.js';

const keys = ['AC', '(', ')', '⌫', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+'];

export function DesktopCalculator() {
  const [expression, setExpression] = useState(''), [result, setResult] = useState('0'), [error, setError] = useState(''), [history, setHistory] = useState([]);
  const input = useRef(null), finished = useRef(false);
  function solve(event) {
    event?.preventDefault();
    try {
      const value = calculate(expression);
      setResult(value); setError(''); finished.current = true;
      setHistory(previous => [{ expression, value }, ...previous].slice(0, 8));
    } catch (failure) { setError(failure.message); }
  }
  function press(key) {
    setError('');
    const wasFinished = finished.current;
    if (key === 'AC') { setExpression(''); setResult('0'); }
    else if (key === '⌫') setExpression(previous => previous.slice(0, -1));
    else setExpression(previous => {
      const start = wasFinished ? (/^[+−×÷%]$/.test(key) ? result : '') : previous;
      return (start + key).slice(0, 120);
    });
    finished.current = false;
    input.current?.focus();
  }
  return <div className="linux-utility linux-calculator">
    <span className="linux-eyebrow">A little everyday math</span>
    <form onSubmit={solve}>
      <label className="linux-sr-only" htmlFor="linux-calculation">Calculation</label>
      <input ref={input} id="linux-calculation" autoComplete="off" spellCheck={false} placeholder="24 × (3 + 2)" maxLength={120} value={expression} onChange={event => { setExpression(event.target.value); setError(''); finished.current = false; }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); press('AC'); } }} />
      <output className="linux-calculator-result" aria-label="Calculation result" aria-live="polite">{result}</output>
      <div className="linux-calculator-keys">{keys.map(key => <button type="button" key={key} aria-label={key === 'AC' ? 'Clear calculation' : key === '⌫' ? 'Backspace' : key} className={/[÷×−+]/.test(key) ? 'is-operator' : ''} onClick={() => press(key)}>{key}</button>)}</div>
      <button className="linux-primary linux-calculate" type="submit">Calculate <span aria-hidden="true">=</span></button>
    </form>
    <p className="linux-utility-status" role="status">{error || 'Enter to calculate · % divides a value by 100'}</p>
    {history.length > 0 && <details className="linux-calculation-history"><summary>Recent calculations <span>{history.length}</span></summary><ol>{history.map((entry, index) => <li key={index}><button type="button" onClick={() => { setExpression(entry.expression); setResult(entry.value); finished.current = false; input.current?.focus(); }}><span>{entry.expression}</span><b>= {entry.value}</b></button></li>)}</ol></details>}
  </div>;
}
