# Digimon personal card — audit and implementation plan

Status: Implementation complete and verified locally, October 12, 2026. This document retains the asset audit and records the delivered architecture. Research sheets stay in ignored `.preview/`; only prepared frames and source credits are included in the production build. No deployment was performed for this task.

## Direction: a little digital companion

Replace the Monterrey illustration card in **03 / Behind the browser** with a small virtual pet. Keep the About text, learning link, Rubik's cube, surrounding layout, Workbench, Playground, and Services intact.

This location connects the hobby to Jose. The Playground already carries the landscape experiment; putting another game there would lose that personal context.

Use the existing cream card against charcoal, with a muted olive habitat, a simple ground plane, and the original colored Digimon as its focal point. The user's approved refinement restores the original Monterrey city and mountain illustration as a subdued backdrop. No additional night sky, weather, neon, or font. The second refinement restores the card flip and personal note. Controls stay level; the old decorative stamp and scene-lighting controls are removed.

Implemented copy: **“A little digital company.”** Supporting line: **“A small tribute to my love of Digimon.”** This uses only the interest Jose has stated; no invented childhood story.

The front's hierarchy:

1. Small hobby caption and stage label.
2. Fixed-height 230px habitat, with room for every evolution.
3. Name and one plain-language condition.
4. Compact Food, Happiness, and Energy meters; one evolution progress line.
5. Feed / Train / Rest / Pet, four equal controls, at least 44px high.
6. A quieter link/button to the personal note; detailed age, training requirements, and care history can live in a disclosure.

Target the existing approximately 415px desktop column. On mobile use available width, with a 2×2 control layout when four buttons no longer fit. Keep the total height stable between stages and both card faces. A reverse-side card must make hidden controls inert and return focus correctly. Reduced motion swaps faces without a 3D flip.

## Original implementation audit

- React 18, Vite 5, plain CSS; GSAP is available. No game engine is needed.
- `src/components/StudioPortfolio.jsx` imports and places `MonterreyPostcard` directly inside `#about`.
- `MonterreyPostcard.jsx` owns skyline SVG, lighting, pointer tilt, entrance, flip, and the personal note. Its CSS is separate, with some shared sizing rules in `studio.css` and `studio-editorial.css`.
- About is a two-column grid that becomes one column below the existing mobile breakpoint. Scope new CSS to the pet; do not alter shared `figure`, `button`, or section styles.
- The current postcard's GSAP listeners and effects must disappear with that component; do not retain dead mountain animation selectors in the replacement.
- Existing Node assertion scripts and Playwright checks provide the testing pattern. Keep game rules testable without a browser.

## Verified asset inventory

I downloaded and visually inspected the five sheets below. Their URLs were taken from the actual source pages. The DS sheets mix large battle poses with small overworld frames; these should not be mistaken for one interchangeable animation set.

| Character | Source and dimensions | Verified contents and limitation |
|---|---|---|
| Agumon | [World DS, asset 48418](https://www.spriters-resource.com/ds_dsi/dgmnworldds/asset/48418/), 352×144 | Nine small overworld frames, supporting directional walk and idle sequences; five larger battle/reaction poses. No dedicated eating/sleeping sequence identified. |
| Greymon | [World DS, asset 48406](https://www.spriters-resource.com/ds_dsi/dgmnworldds/asset/48406/), 346×387 | Small walk/idle strip and larger battle poses. No dedicated care sequence identified. |
| MetalGreymon | [World DS, asset 48322](https://www.spriters-resource.com/ds_dsi/dgmnworldds/asset/48322/), 395×432 | Small overworld frame groups, larger battle poses, and alternate palette material. Use the orange character consistently. No dedicated care sequence identified. |
| WarGreymon | [World DS, asset 48613](https://www.spriters-resource.com/ds_dsi/dgmnworldds/asset/48613/), 408×518 | Small walk/idle strip and larger battle poses. No dedicated care sequence identified. |
| WarGreymon alternative | [World Championship, file 17878](https://spritedatabase.net/file/17878), 530×1800 | Explicitly labeled idle, walk, run, tired, lying, push-up, eating, attacks, and multiple happy reactions. Much richer care coverage, but a different sprite set. |

Credits visible on the DS sheets: Agumon — Mighty Jetters and redblueyellow; Greymon — A.J. Nitro and redblueyellow; MetalGreymon — RadSpyro; WarGreymon — A.J. Nitro and Dazz. Championship WarGreymon credits Hyperlon. Preserve credits even where an old sheet says credit is unnecessary.

The [Championship index](https://spritedatabase.net/game/1800) does not list matching full Agumon, Greymon, and MetalGreymon care sheets. This is a limitation of the collection inspected, not a claim that such assets do not exist anywhere.

### Other requested sources

- [DigimonWorldSpriteManager](https://github.com/netraular/DigimonWorldSpriteManager): Python extraction/authoring tooling and committed frame specifications. Raw sheets and generated output are not in the inspected tree. Useful as a reference for consistent cells and bottom-center anchors. Its README describes directional walking and idle clips, with optional sleep; optional support does not establish that a character has sleep art. No license file was found in the inspected repository. Do not copy this code into the portfolio or add its processing stack as a runtime dependency.
- [DigimonVPet](https://github.com/Berational91/DigimonVPet): ESP32/Arduino C++, not a React widget. Its [sprite header](https://github.com/Berational91/DigimonVPet/blob/master/src/VPetLCD/ImageData/DigimonSprites.h) contains 16×16 monochrome bitmaps and named walk, happy, eating, and sleep slots. Agumon's source explicitly marks frames after its eight originals as filler, so twelve slots do not mean twelve authentic poses. The requested complete four-character line is not supplied here. The repository carries an [MIT software license](https://github.com/Berational91/DigimonVPet/blob/master/LICENSE); it does not establish a separate rights-holder license for Digimon artwork.

### Asset decision and missing material

Prefer the **World DS overworld set** for consistent scale and style across all four stages. Use integer pixel scaling, shared ground anchors, and per-stage bounds. Keep source sheets outside the deployed bundle; prepare only the required transparent frames after the asset decision.

Missing for each DS stage: confirmed dedicated eating, lying/sleeping, training, and affectionate reaction sequences. Also no complete transformation sequence was identified. A short transition between the correct characters can be authored in code without pretending it is a game-ripped animation.

Implemented care fallbacks: stop wandering, use a valid character pose or short existing clip, show a small food/rest/training cue, and update its condition. Walking uses genuine frame sequences. The journal and source credits disclose simplified care reactions; these are not dedicated eating or sleeping sprites.

Metadata should distinguish real clips from fallbacks. Missing files should render a clearly labeled unavailable-art state, not a broken image or unrelated creature. Final production art should not silently fall back to a placeholder.

### Attribution and implementation choice

After the audit, the user explicitly approved an unofficial fan implementation using the original Digimon sprites, with source credits and an ownership acknowledgement. The card includes both, plus a no-affiliation statement. Attribution records provenance; no separate rights-holder license was established by the asset audit. No third-party pet-engine code is imported.

## Implemented structure

```text
src/components/digimon/
  DigimonPetCard.jsx       shell, note, error boundary
  MonterreyHabitat.jsx     original city artwork, adapted to the olive palette
  PetHabitat.jsx           bounds and visibility
  PetSprite.jsx            frame playback, facing, movement
  PetControls.jsx          four actions and feedback
  PetStats.jsx             readable condition and progress
  DigimonPet.css
src/hooks/useDigimonPet.js state and lifecycle
src/lib/digimon/
  engine.js                pure time, care and action updates
  storage.js               versioned, validated saves
src/data/digimon/
  stages.js                sprite metadata and fallbacks
  evolutionRules.js        data-driven progression
public/sprites/digimon/    four prepared sprite strips and credits.txt
scripts/test-digimon.mjs   pure engine and save validation tests
scripts/check-digimon.cjs  browser, interaction, recovery, and screenshot checks
scripts/prepare-digimon-sprites.cjs   reproducible frame preparation
```

Evolution presentation can stay in the card initially; split it into its own component only if it becomes substantial. Do not import a game engine or the Arduino/Python projects.

## Mechanics and lifecycle decisions

- Use 0–100 values. Internally and visibly call satiety **Food**, so a fuller bar means better fed.
- Pure engine actions: feed, train, rest/wake, pet, advance time, evaluate evolution, complete evolution. Animation reads the result; it never determines stat changes.
- A single activity state prevents sleeping, eating, and training simultaneously. Evolution takes priority, freezes normal actions, and commits the new stage exactly once. Reload during evolution must not skip or double-award a stage.
- Short action cooldowns, enough energy required to train, no duplicated gains from rapid taps. Care mistakes count a sustained neglect episode once, not once per update. Allow recovery so an old mistake never permanently blocks the main evolution line.
- Evolution rules consider current stage, active care time, training, happiness, food, energy, and care history. Cumulative time thresholds are 2, 5, and 9 active minutes; cumulative training is 24, 56, and 96. Each training action grants 8. Up to three care mistakes add four training points each, so recovery remains possible. Requirements are visible in the care journal.
- Save version, stage, stats, active care time, creation time, last interaction, and last saved timestamp. Validate finite values and known stages; clamp ranges. Handle old schema, corrupt JSON, storage denial, and future timestamps without crashing.
- Cap offline decay at two hours, with stat floors and no offline care mistakes. Calendar age may advance, but offline time cannot grant training or start new evolutions. An already-started transition may complete once.
- Save on actions, bounded periodic checkpoints, and page hiding; avoid per-frame storage. Handle another tab's newer save explicitly to prevent stale overwrites.
- One animation loop, separate from the coarse stat clock. Stop it offscreen, on the card's reverse, and in hidden browser tabs. Apply bounded elapsed time on resumption. React should not rerender the entire portfolio for each sprite frame.
- Reduced motion freezes autonomous travel and looping frames, retaining immediate action feedback and a simple stage replacement. Add a quiet pause option through secondary controls for visitors who want to stop ambient motion.
- Fixed habitat geometry, keyboard-native buttons, visible focus, labeled meters, and polite announcements only for actions/evolution. An initialization failure leaves the surrounding About section intact.

## Phased delivery and checks

1. **Audit complete:** source inventory, original-frame review, implementation approval, and explicit care-animation limitations.
2. **Living Agumon verified:** actual walk/idle frame playback, bounded wandering, natural pauses, responsive habitat, offscreen pause, and reduced motion.
3. **Care verified:** all four actions, cooldowns, rest/wake, stat boundaries, recoverable neglect episodes, and action conflict protection.
4. **Persistence verified:** reload, corrupt saves, denied storage, all-stage restore, multi-tab synchronization, clock anomalies, and bounded offline decay.
5. **Evolution verified:** all three transitions, preloading, disabled controls during transformation, mid-evolution reload, stable stage dimensions, and continued Mega care.
6. **Visual review complete:** 1440, 1024, 768, 390, and 320px. The tablet composition stacks before the card becomes cramped. MetalGreymon's separately sourced frames now share the same ground anchor. Keyboard flip, inert hidden faces, reduced motion, missing-image fallback, and background-tab suspension pass browser checks. Other professional sections retain their components and styles.

### Reproduce checks

- `npm run test:pet` — pure engine, persistence validation, and evolution checks.
- `npm run build` — production build. Existing Linux/v86 browser-external and large-chunk warnings remain.
- With Vite running and Playwright available: `node scripts/check-digimon.cjs`. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if it is not on the module path; no new package is required by the site.
- Screenshots and browser results are in ignored `.preview/digimon-*.png` and `.preview/digimon-browser-results.json`.
- Four prepared PNG strips total about 30KB. They load locally; source sheets are not shipped.

Version one has no optional evolution branches, sound, weather, accounts, backend, battles, or visitor character selection. Dedicated care animations remain the only deliberate asset limitation: existing character poses and short cues are used and disclosed in the card.
