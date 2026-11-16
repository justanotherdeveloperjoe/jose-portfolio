// A small arithmetic parser: no eval, scripts, or third-party runtime.
export function calculate(expression: string): string {
  const source = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  if (!source || source.length > 120) throw new Error('Enter a calculation up to 120 characters.');
  const tokens = source.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[()+\-*/%]/gi) || [];
  if (tokens.join('') !== source.replace(/\s/g, '')) throw new Error('Use numbers, parentheses, and arithmetic operators.');
  let at = 0;
  function primary(): number {
    let value: number;
    if (tokens[at] === '+') { at++; return primary(); }
    if (tokens[at] === '-') { at++; return -primary(); }
    if (tokens[at] === '(') {
      at++; value = sum();
      if (tokens[at++] !== ')') throw new Error('Close the parentheses.');
    } else {
      const token = tokens[at++];
      if (!token || !/^(?:\d|\.)/.test(token)) throw new Error('Complete the calculation.');
      value = Number(token);
    }
    while (tokens[at] === '%') { value /= 100; at++; }
    return value;
  }
  function product(): number {
    let value = primary();
    while (tokens[at] === '*' || tokens[at] === '/') {
      const operation = tokens[at++], next = primary();
      if (operation === '/' && next === 0) throw new Error('Cannot divide by zero.');
      value = operation === '*' ? value * next : value / next;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (tokens[at] === '+' || tokens[at] === '-') {
      const operation = tokens[at++], next = product();
      value = operation === '+' ? value + next : value - next;
    }
    return value;
  }
  const result = sum();
  if (at !== tokens.length) throw new Error('Check the calculation.');
  if (!Number.isFinite(result)) throw new Error('That result is too large.');
  return String(Number(result.toPrecision(12)));
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - offset + 1));
}

export interface TimerState { mode: 'countdown' | 'stopwatch'; duration: number; elapsed: number; running: boolean; startedAt: number; completed: boolean }

export function timerElapsed(timer: Pick<TimerState, 'mode' | 'duration' | 'elapsed' | 'running' | 'startedAt'>, now: number): number {
  const elapsed = timer.elapsed + (timer.running ? Math.max(0, now - timer.startedAt) : 0);
  return timer.mode === 'countdown' ? Math.min(timer.duration, elapsed) : elapsed;
}
