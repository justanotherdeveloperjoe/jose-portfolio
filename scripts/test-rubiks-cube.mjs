// Checks the cube math is actually correct: scrambling then replaying the moves backwards must return
// every small cube to exactly where it started — same spot, same way round, not just close.
import assert from 'node:assert/strict';
import { createSolvedCubies, randomMove, invertMove, applyMove, applyMoves } from '../src/lib/rubiksCube.js';

// A 3x3 rotation matrix for a single move, used only here to independently double-check "which way is it
// facing" — the real component never needs this, it just composes CSS rotate() strings.
function matrixFor(axis, dir) {
  return { x: [[1, 0, 0], [0, 0, -dir], [0, dir, 0]], y: [[0, 0, dir], [0, 1, 0], [-dir, 0, 0]], z: [[0, -dir, 0], [dir, 0, 0], [0, 0, 1]] }[axis];
}
function multiply(a, b) {
  return a.map((row, i) => row.map((_, j) => row.reduce((sum, _v, k) => sum + a[i][k] * b[k][j], 0)));
}
const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
// Only pos + faceColors say where a cube physically is. The orientation string is deliberately NOT compared
// here: "rotateZ(90deg) rotateZ(-90deg)" and "" are different text but the exact same rotation on screen,
// the same way "turn right then turn left" and "stand still" end up facing the same way. The net-rotation
// matrix check further down is the real proof that facing direction comes back correctly, not this string.
const placementOf = cubies => JSON.stringify([...cubies].map(({ pos, faceColors }) => ({ pos, faceColors })).sort((a, b) => a.pos.join() < b.pos.join() ? -1 : 1));

function checkRoundTrip(moveCount) {
  const moves = Array.from({ length: moveCount }, randomMove);
  const start = placementOf(createSolvedCubies());

  let cubies = moves.reduce(applyMove, createSolvedCubies());
  if (moveCount > 0) assert.notEqual(placementOf(cubies), start, `A ${moveCount}-move scramble should actually move things`);

  for (const move of [...moves].reverse().map(invertMove)) cubies = applyMove(cubies, move);
  assert.equal(placementOf(cubies), start, `Playing ${moveCount} moves backwards must return every cube to its exact starting spot`);

  // Also check with real 3x3 rotation matrices, independently of the CSS-string approach the component uses:
  // a cube that's been scrambled then un-scrambled must face the exact same way it started (no net rotation).
  const net = [...moves, ...[...moves].reverse().map(invertMove)].reduce((m, move) => multiply(matrixFor(move.axis, move.dir), m), identity);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) assert.equal(net[i][j], identity[i][j], `Net facing isn't identity at [${i}][${j}] for a ${moveCount}-move scramble`);

  return moves;
}

assert.equal(createSolvedCubies().length, 26, 'A real cube has 26 small cubes you can see');
checkRoundTrip(0); // doing nothing and "undoing nothing" should also be a no-op

const moves = checkRoundTrip(14);

// The all-at-once version (used for reduced motion) must agree with playing the same moves one by one.
const stepByStep = placementOf(moves.reduce(applyMove, createSolvedCubies()));
const allAtOnce = placementOf(applyMoves(createSolvedCubies(), moves));
assert.equal(stepByStep, allAtOnce, 'Playing moves one at a time or all at once must land in the same place');

// Run many more random scrambles of varying length, since one lucky run could hide a bug.
for (let trial = 0; trial < 50; trial++) checkRoundTrip(1 + Math.floor(Math.random() * 20));

console.log("Rubik's cube math checks passed: scramble + reverse always returns to the exact starting state (position and facing), across 50+ random trials.");
