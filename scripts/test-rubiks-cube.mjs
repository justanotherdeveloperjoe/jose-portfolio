// Checks the cube is a real, valid Rubik's cube at every step — not just that it ends up solved.
// The rule a real cube always obeys: every colored sticker faces outward, and no outside square is plastic.
import assert from 'node:assert/strict';
import { createSolvedCubies, randomMove, invertMove, applyMove, applyMoves, faces, turnMatrix, transform, identity } from '../src/lib/rubiksCube.js';

// The browser's own rotations, from the CSS Transforms spec, computed independently of the cube code.
function cssRotation(fn, degrees) {
  const r = degrees * Math.PI / 180, c = Math.round(Math.cos(r)), s = Math.round(Math.sin(r));
  if (fn === 'rotateX') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (fn === 'rotateY') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
function parseRotation(css) {
  const match = css.match(/^(rotate[XYZ])\((-?\d+)deg\)$/);
  return match ? cssRotation(match[1], Number(match[2])) : identity;
}

// 1. Each face's CSS really points it the way the model says (renderer and model agree).
for (const face of faces) {
  assert.deepEqual(transform(parseRotation(face.css), [0, 0, 1]), face.normal, `${face.key} face CSS points the wrong way`);
}

// 2. A move turns pieces exactly the way the browser animates that same move (rotateX/Y/Z ±90deg).
for (const axis of ['x', 'y', 'z']) for (const dir of [1, -1]) {
  assert.deepEqual(turnMatrix(axis, dir), cssRotation(`rotate${axis.toUpperCase()}`, dir * 90), `${axis} turn ${dir} doesn't match CSS`);
}

// 3. The valid-cube rule, checked on every piece.
function assertValidCube(cubies, label) {
  assert.equal(cubies.length, 26, `${label}: 26 pieces`);
  const seenSlots = new Set();
  for (const cubie of cubies) {
    assert.ok(cubie.pos.every(v => v === -1 || v === 0 || v === 1), `${label}: ${cubie.id} is off the grid`);
    assert.ok(cubie.turn.flat().every(v => v === -1 || v === 0 || v === 1), `${label}: ${cubie.id} has a non-quarter-turn rotation`);
    seenSlots.add(cubie.pos.join());
    const outward = cubie.pos.flatMap((v, i) => v === 0 ? [] : [[0, 1, 2].map(k => k === i ? v : 0).join()]).sort();
    const stickers = faces.filter(face => cubie.faceColors[face.key]).map(face => transform(cubie.turn, face.normal).join()).sort();
    assert.deepEqual(stickers, outward, `${label}: ${cubie.id} at [${cubie.pos}] has stickers facing [${stickers.join(' | ')}], outside is [${outward.join(' | ')}] — plastic would show`);
  }
  assert.equal(seenSlots.size, 26, `${label}: two pieces share a slot`);
}

assertValidCube(createSolvedCubies(), 'solved');
for (const axis of ['x', 'y', 'z']) for (const layer of [-1, 0, 1]) for (const dir of [1, -1]) {
  assertValidCube(applyMove(createSolvedCubies(), { axis, layer, dir }), `one ${axis}${layer}${dir > 0 ? '+' : '-'} turn`);
}

// 4. Hundreds of random scrambles: valid after EVERY single turn, and exactly solved after undoing.
const solved = JSON.stringify(createSolvedCubies());
for (let trial = 0; trial < 300; trial++) {
  const moves = Array.from({ length: 1 + Math.floor(Math.random() * 25) }, randomMove);
  let cubies = createSolvedCubies();
  moves.forEach((move, i) => { cubies = applyMove(cubies, move); assertValidCube(cubies, `trial ${trial}, turn ${i + 1}`); });
  [...moves].reverse().map(invertMove).forEach((move, i) => { cubies = applyMove(cubies, move); assertValidCube(cubies, `trial ${trial}, undo ${i + 1}`); });
  // Not just "looks solved": every piece is back in its own slot with no leftover rotation at all.
  assert.equal(JSON.stringify(cubies), solved, `trial ${trial}: undoing ${moves.length} moves didn't land exactly on solved`);
}

// 5. The no-animation version (reduced motion) lands exactly where turning one at a time does.
const sample = Array.from({ length: 14 }, randomMove);
assert.equal(JSON.stringify(applyMoves(createSolvedCubies(), sample)), JSON.stringify(sample.reduce(applyMove, createSolvedCubies())));

console.log("Rubik's cube checks passed: faces and turns match the browser's CSS, the cube is valid (no plastic outside) after every turn of 300 random scrambles, and every scramble undoes to exactly solved.");
