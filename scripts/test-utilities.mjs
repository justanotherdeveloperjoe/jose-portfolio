import assert from 'node:assert/strict';
import { calculate, calendarDays, dateKey, timerElapsed } from '../src/components/sandbox/utilityMath.js';

assert.equal(calculate('2 + 3 × 4'), '14');
assert.equal(calculate('(2 + 3) × 4'), '20');
assert.equal(calculate('-2 * (-3 + 1)'), '4');
assert.equal(calculate('200 * 15%'), '30');
assert.equal(calculate('0.1 + 0.2'), '0.3');
assert.equal(calculate('1e+12 / 2'), '500000000000');
for (const input of ['1 / 0', '2+(', '1 2', 'alert(1)', '2**3', '', '9'.repeat(121)]) {
  assert.throws(() => calculate(input));
}
const february = calendarDays(2024, 1);
assert.equal(february.length, 42);
assert.equal(february[0].getDay(), 1);
assert.ok(february.some(date => dateKey(date) === '2024-02-29'));
assert.equal(calendarDays(2025, 1).some(date => dateKey(date) === '2025-02-29'), false);
assert.equal(dateKey(new Date(2026, 0, 1)), '2026-01-01');
const timer = { mode: 'countdown', duration: 60000, elapsed: 10000, running: true, startedAt: 1000 };
assert.equal(timerElapsed(timer, 21000), 30000);
assert.equal(timerElapsed(timer, 100000), 60000);
assert.equal(timerElapsed({ ...timer, running: false }, 100000), 10000);
assert.equal(timerElapsed({ ...timer, mode: 'stopwatch' }, 100000), 109000);
console.log('Arithmetic precedence/errors, leap-year calendar, and timer pause/deadline behavior: PASS');
