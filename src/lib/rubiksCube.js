// The plain model behind the cube: where each small cube ("cubie") sits, and which way it's facing.
// No solver is needed. Scrambling just plays random moves and remembers them; "solving" replays the
// exact same moves backwards. Undoing a move you just made always returns you to where you started,
// so this can never land on a wrong or stuck state — it's guaranteed to end up solved again.

export const axes = ['x', 'y', 'z'];

// The 6 sticker colors, loosely matching a real cube (U/D/R/L/F/B), plus the dark plastic body color.
export const colors = { up: '#f1efe2', down: '#f0c23e', right: '#d4453a', left: '#e8822e', front: '#5f9a56', back: '#3f6fb8' };
export const plastic = '#17180f';

// Rotates a whole-number position 90° (times dir, so dir=-1 undoes it) around one axis.
// Example: turning around y swaps x and z, the same way turning a steering wheel swaps "forward" and "left".
function rotatePosition([x, y, z], axis, dir) {
  if (axis === 'x') return [x, -dir * z, dir * y];
  if (axis === 'y') return [dir * z, y, -dir * x];
  return [-dir * y, dir * x, z];
}

// The CSS rotation for that same move, so the little cube's visuals turn exactly as far as its position moved.
const cssAxis = { x: 'rotateX', y: 'rotateY', z: 'rotateZ' };
export function cssRotateFor(axis, dir) {
  return `${cssAxis[axis]}(${dir * 90}deg)`;
}

// The 26 small cubes around the outside of a 3x3x3 (the one hidden in the very middle is never seen, so it's skipped).
// Each one remembers its starting position (to color its outer faces) and its current position + facing.
export function createSolvedCubies() {
  const cubies = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (x === 0 && y === 0 && z === 0) continue; // the hidden center cube
    const faceColors = {};
    if (x === 1) faceColors.right = colors.right; if (x === -1) faceColors.left = colors.left;
    if (y === 1) faceColors.up = colors.up; if (y === -1) faceColors.down = colors.down;
    if (z === 1) faceColors.front = colors.front; if (z === -1) faceColors.back = colors.back;
    cubies.push({ id: `${x},${y},${z}`, pos: [x, y, z], orientation: '', faceColors });
  }
  return cubies;
}

// A random single move: an axis to spin around, which of the 3 slices (-1, 0 or 1), and which way.
export function randomMove() {
  return {
    axis: axes[Math.floor(Math.random() * 3)],
    layer: Math.floor(Math.random() * 3) - 1,
    dir: Math.random() < 0.5 ? 1 : -1,
  };
}

// Turning a move around just means flipping its direction — the thing that undoes a move.
export function invertMove(move) {
  return { ...move, dir: -move.dir };
}

// Plays one move: every cubie in that slice gets rotated, in position and in which way it's facing. The
// rest of the cubies are left exactly as they are, same objects, so nothing is wasted re-rendering them.
export function applyMove(cubies, { axis, layer, dir }) {
  const axisIndex = { x: 0, y: 1, z: 2 }[axis];
  return cubies.map(cubie => cubie.pos[axisIndex] !== layer ? cubie : {
    ...cubie,
    pos: rotatePosition(cubie.pos, axis, dir),
    orientation: `${cssRotateFor(axis, dir)} ${cubie.orientation}`,
  });
}

// Applies a whole list of moves at once, with no animation — used for the reduced-motion version,
// which jumps straight from solved to scrambled to solved instead of turning step by step.
export function applyMoves(cubies, moves) {
  return moves.reduce(applyMove, cubies);
}
