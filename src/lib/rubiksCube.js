// The plain model behind the cube. No solver is needed: scrambling plays random moves and remembers them,
// and "solving" replays the exact same moves backwards. Undoing your own moves always lands back on solved.
//
// Everything here uses the same directions the browser draws in (CSS 3D: x to the right, y DOWN the
// screen, z toward you). A move turns a small cube's position and its stickers with one and the same
// rotation matrix, so where a piece sits and which way its stickers face can never disagree.

// The 6 sticker colors (loosely a real cube's), plus the dark plastic body.
export const colors = { up: '#f1efe2', down: '#f0c23e', right: '#d4453a', left: '#e8822e', front: '#5f9a56', back: '#3f6fb8' };
export const plastic = '#17180f';

// Each small cube's six faces: the CSS that places it, and the direction it then points (before any turns).
export const faces = [
  { key: 'right', css: 'rotateY(90deg)', normal: [1, 0, 0] },
  { key: 'left', css: 'rotateY(-90deg)', normal: [-1, 0, 0] },
  { key: 'up', css: 'rotateX(90deg)', normal: [0, -1, 0] },
  { key: 'down', css: 'rotateX(-90deg)', normal: [0, 1, 0] },
  { key: 'front', css: '', normal: [0, 0, 1] },
  { key: 'back', css: 'rotateY(180deg)', normal: [0, 0, -1] },
];

export const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const multiply = (a, b) => a.map(row => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)));
export const transform = (m, v) => m.map(row => row.reduce((sum, value, k) => sum + value * v[k], 0));

// Exactly what CSS rotateX / rotateY / rotateZ do for a quarter turn (dir is 1 or -1).
export function turnMatrix(axis, dir) {
  if (axis === 'x') return [[1, 0, 0], [0, 0, -dir], [0, dir, 0]];
  if (axis === 'y') return [[0, 0, dir], [0, 1, 0], [-dir, 0, 0]];
  return [[0, -dir, 0], [dir, 0, 0], [0, 0, 1]];
}

// The 26 small cubes you can see (the one hidden in the very middle is skipped). Each one keeps the
// stickers it was born with; turning moves it and spins it, but never repaints it.
export function createSolvedCubies() {
  const cubies = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (x === 0 && y === 0 && z === 0) continue;
    const faceColors = {};
    if (x === 1) faceColors.right = colors.right;
    if (x === -1) faceColors.left = colors.left;
    if (y === -1) faceColors.up = colors.up; // y points down the screen, so the top row is y = -1
    if (y === 1) faceColors.down = colors.down;
    if (z === 1) faceColors.front = colors.front;
    if (z === -1) faceColors.back = colors.back;
    cubies.push({ id: `${x},${y},${z}`, pos: [x, y, z], turn: identity, faceColors });
  }
  return cubies;
}

// A random single move: an axis to spin around, which of the 3 slices (-1, 0 or 1), and which way.
export function randomMove() {
  return { axis: 'xyz'[Math.floor(Math.random() * 3)], layer: Math.floor(Math.random() * 3) - 1, dir: Math.random() < 0.5 ? 1 : -1 };
}

// Undoing a move is the same move the other way round.
export function invertMove(move) {
  return { ...move, dir: -move.dir };
}

// Plays one move: every small cube in that slice is moved and spun by the same quarter-turn. The rest are
// returned untouched (same objects), so nothing else re-renders.
export function applyMove(cubies, { axis, layer, dir }) {
  const index = { x: 0, y: 1, z: 2 }[axis], matrix = turnMatrix(axis, dir);
  return cubies.map(cubie => cubie.pos[index] !== layer ? cubie : { ...cubie, pos: transform(matrix, cubie.pos), turn: multiply(matrix, cubie.turn) });
}

// Many moves at once with no animation, for the reduced-motion version.
export function applyMoves(cubies, moves) {
  return moves.reduce(applyMove, cubies);
}

// A piece's whole history of turns as one CSS matrix: the same short string after 1 move or 1,000.
export function turnCss(m) {
  return `matrix3d(${m[0][0]}, ${m[1][0]}, ${m[2][0]}, 0, ${m[0][1]}, ${m[1][1]}, ${m[2][1]}, 0, ${m[0][2]}, ${m[1][2]}, ${m[2][2]}, 0, 0, 0, 0, 1)`;
}
