# A little Rubik's cube

In the About section, next to "Currently building with", there's a small 3D Rubik's cube. Click it: it
shuffles itself, pauses for a beat, then works itself back to solved on its own, with no outside help.

## How it "solves" itself

There's no real Rubik's cube solver in here, and there doesn't need to be one. Scrambling just plays 14
random moves and remembers them in order. "Solving" plays the exact same list backwards, with each move
flipped the other way. Undoing a move you just made always puts you back where you started — so this can
never get stuck or end up wrong, it's guaranteed to land back on solved every single time.

`src/lib/rubiksCube.js` holds that plain logic. It works in the same directions the browser draws in
(CSS 3D: x right, y down the screen, z toward you). Each of the 26 small cubes stores where it sits and
one 3x3 rotation for which way it faces; a move moves it and spins it with the very same quarter-turn
matrix the browser uses for `rotateX/Y/Z`, so a piece's position and its stickers can never disagree.

`src/components/RubiksCube.jsx` draws and animates it with plain CSS 3D transforms, no library. Each move
gathers its slice of small cubes into one group and spins it with the Web Animations API (as the rest of the
site animates). That turn's own animation finishing is what commits it; a backup timer per turn covers a
browser that never reports the finish (a background tab), and can only ever finish its own turn. Clicks
while it's busy are ignored; the cube stays focusable (`aria-disabled`, not `disabled`), so keyboard focus
isn't dropped mid-cycle.

With reduced motion turned on, nothing spins — it jumps straight from solved to scrambled to solved, with
a short pause and a status announcement.

## Fixed on October 12, 2026

The first version had three bugs, all reproduced before fixing:

- **Black plastic on the outside.** The model treated +y as up while the browser treats +y as down. Turns
  around the y axis happened to work, but every x or z turn moved a piece one way and spun its stickers the
  other: 12 stickers faced inward after a single x turn, and up to 36 of the 54 outside squares showed black
  after a scramble. Pieces also snapped after each x or z turn, landing where the opposite turn would put them.
- **Turns skipped while solving.** Each turn's backup timer finished "whichever turn was current" when it
  fired, which during the faster solve was often the next one: only 9 of 14 solve turns were ever drawn,
  two of them cut off at 0°. The rest jumped into place.
- **Transforms that kept growing.** Every turn appended a `rotate()` to the affected pieces and nothing ever
  cleaned them up: after 50 clicks one piece carried 514 stacked rotations. Facing is now one fixed-size
  `matrix3d`, the same length after one move or a thousand.

The first test missed the black faces because it only checked that undoing a scramble ends solved, not that
the cube was a valid cube in between. The tests below check that directly.

## Checks

- `npm run test:cube`: each face's CSS points where the model says, each move's matrix equals the browser's
  own `rotateX/Y/Z` for that turn, and after every single turn of 300 random scrambles the cube is valid
  (every colored sticker faces outward, no outside square is plastic, no two pieces share a slot). Every
  scramble undoes to exactly the solved state. Planting the original bug back makes it fail on the first x turn.
- `scripts/check-rubiks-cube.cjs` (needs the dev server and Playwright; `PORTFOLIO_URL` defaults to
  `http://127.0.0.1:5173`), in a real browser:
  - all 28 turns of a cycle spin a full quarter-turn, none cut short or skipped;
  - using only the transforms the browser computed (not the model), no plastic shows outside at any point
    between turns (about 160 checks per cycle), nor in the reduced-motion scrambled state;
  - it ends exactly solved and announces "Solved.", a second click re-shuffles differently, and a piece's
    CSS doesn't grow with clicks;
  - keyboard focus stays on the cube while it's busy, it fits on a phone, and reduced motion still finishes.

Screenshots: `.preview/rubiks-solved.png`, `.preview/rubiks-scrambling.png`, `.preview/rubiks-solved-again.png`,
`.preview/rubiks-mobile.png`, `.preview/rubiks-reduced-scrambled.png`. Chromium verified; other browsers and
physical devices have not been tested. Not deployed.
