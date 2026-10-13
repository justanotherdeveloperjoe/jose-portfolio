# A little Rubik's cube

In the About section, next to "Currently building with", there's now a small 3D Rubik's cube. Click it: it
shuffles itself, pauses for a beat, then works itself back to solved on its own, with no outside help.

## How it "solves" itself

There's no real Rubik's cube solver in here, and there doesn't need to be one. Scrambling just plays 14
random moves and remembers them in order. "Solving" plays the exact same list backwards, with each move
flipped the other way. Undoing a move you just made always puts you back where you started — so this can
never get stuck or end up wrong, it's guaranteed to land back on solved every single time.

`src/lib/rubiksCube.js` holds that plain logic: where each of the 26 small cubes sits, which way it's
turned, and the two tiny functions (rotate a position, flip a move) everything else is built from.
`scripts/test-rubiks-cube.mjs` proves it: 50+ random scrambles, each one undone and checked, both in
position and in which way every small cube ends up facing (not just trusting the position came back).

`src/components/RubiksCube.jsx` is the part that actually draws and animates it, the same way the project
cards already tilt in 3D elsewhere on the site — plain CSS, no library. One move at a time gets its own
little group of cubes, spun together with a CSS transition; once that's really finished (not just "probably
finished" — there's a backup timer too, in case a backgrounded tab skips the animation), the next move
starts. Clicking while it's already shuffling or solving does nothing, so it can't be interrupted
mid-turn into a confusing state.

With reduced motion turned on, nothing spins — it jumps straight from solved to scrambled to solved, with
a short pause and a status announcement, so screen reader and reduced-motion visitors still see that
something happened, without any continuous motion.

## Checks

- `npm run test:cube` — the math: scramble, undo, and always end up exactly back at solved.
- `scripts/check-rubiks-cube.cjs` (needs the dev server and Playwright; `PORTFOLIO_URL` defaults to
  `http://127.0.0.1:5173`) — in a real browser: 26 cubes are drawn, clicking while busy is ignored, a second
  click genuinely re-shuffles, a full cycle ends back at exactly solved with the "Solved." announcement, it
  stays inside the section on a phone screen, and reduced motion skips the animation but still finishes.
- `scripts/check-footer.cjs` and `scripts/check-workbench.cjs` still pass with the cube in place; the
  footer check's baseline (`.preview/footer-baseline.json`) was recaptured to include it.

Screenshots: `.preview/rubiks-solved.png`, `.preview/rubiks-scrambling.png`, `.preview/rubiks-solved-again.png`,
`.preview/rubiks-mobile.png`. Chromium verified; other browsers and physical devices have not been tested.
The change is local — not committed, not deployed.
