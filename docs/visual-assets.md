# Portfolio visual assets

The studio design uses local assets so visitors do not need third-party font or image requests.

- **Bricolage Grotesque:** variable Latin WOFF2 from [Google Fonts](https://fonts.google.com/specimen/Bricolage+Grotesque), designed by Mathieu Triay. License: SIL Open Font License, included at `public/fonts/OFL.txt`. The Latin subset includes Spanish accented characters.
- **Quinta El Roble photograph:** pool and terrace image from the [Propiedades Allende](https://propiedadesallende.com) project gallery, stored at `public/artwork/allende-property.webp`. [Original image](https://assets.zyrosite.com/BlW7BFDF77mnFapt/2-FauBMZGvVAO2Mh2M.png). Used behind the website mockup on the Propiedades Allende Workbench card.
- **AFH mobile preview:** screenshot of [afh.mx](https://afh.mx) at 390 × 844 pixels, captured September 27, 2026, stored at `public/screenshots/afh-mobile.jpg`. Used on the AFH Logistics Workbench card and the Business Website service.
- **Comedy artwork:** Workbench uses the original orange welcome illustration, cropped with CSS from `public/screenshots/elsotanocomico-welcome.jpg`. This is a direct capture of the live website's welcome section on October 6, 2026. The source remains intact; no synthetic artwork is used.
- **TK Industrial homepage:** capture of [tkindustrial.org](https://tkindustrial.org/) at 1440 × 1000 pixels, taken October 6, 2026, stored at `public/screenshots/tkindustrial.jpg`. Used in the hero deck; the Workbench card keeps its typographic artwork.
- **Ikinuki homepage:** capture of [ikinukitripagency.com](https://www.ikinukitripagency.com/) at 1440 × 1000 pixels, taken October 6, 2026, stored at `public/screenshots/ikinuki.jpg`. The Workbench card shows a CSS crop of the unmodified image; its photography, Playfair Display headline and gold details all come from the live site.
- **Mountain footer:** inline SVG in `src/components/ProjectVisuals.jsx`. The AFH route diagram is inline SVG in `src/components/Workbench.jsx`.

Workbench card compositions are styled in `src/studio.css`; the other visual additions are in `src/studio-editorial.css`. Hero entrance animations and pointer tilt respect reduced-motion preferences; tilt also requires a fine pointer and hover support.

## Interactive story and learning scenes

- `digimon/DigimonPetCard.jsx` houses the personal Digimon fan companion and a reversible note. The original Monterrey illustration is preserved in `MonterreyHabitat.jsx`. Hidden faces are inert, the flip button remains accessible, and reduced motion swaps faces immediately. Prepared sprite strips and attribution live in `public/sprites/digimon/`; see `docs/digimon-pet-plan.md` for mechanics and verification.
- The learning section is a lab notebook (see [learning lab](learning-lab.md)). JavaScript runs editable website examples in a Web Worker; SQL queries and exports the portfolio's actual project data. React demonstrates filtering and a shortlist. Python illustrates filename preparation with editable sample text and a CSV mapping; its processing is JavaScript, not a Python runtime. AWS models storage, cache invalidation, and origin outages locally.
- The atom, bot, and cloud are small inline SVGs in `learning/LabParts.jsx` and `learning/AwsLab.jsx`. State changes provide the feedback; there are no looping learning-scene animations or downloaded illustrations. The notebook's entrance respects reduced motion.
- Edit study topics and goals in `src/data/learning.js`, JavaScript starters in `src/data/jsExamples.js`, and the individual labs in `src/components/learning/`. Filename and cloud models live in `src/lib/learningTasks.js`.

## Off hours arcade

`SpaceArcade.jsx` adds a collapsible, optional arcade below the playground experiments. `spaceGame.js` holds the original pixel sprite patterns and game simulation; it uses Canvas 2D without image downloads or additional libraries.

Controls: arrows or A/D to move, Space to fire, P/Escape to pause, or hold the on-screen controls. The game pauses when its screen leaves view, focus leaves the game panel, or the browser tab becomes hidden. Closing cancels the animation loop. Best score lasts for the current page session. Reduced motion removes the reveal transition and sprite-frame animation; gameplay movement starts only after choosing to play.

Run `npm run test:arcade` for the game simulation checks (movement bounds, collisions, scoring, waves, damage immunity, and game-over).

## Jose's sandbox: a Linux desktop

The optional section below learning uses the existing charcoal, cream, lime, and type choices. It adds no downloaded artwork or font; the desktop wallpaper and window chrome are native CSS.

`SandboxSection.jsx` holds the invitation, the open/close state, and the lazy boundary. `LinuxDesktop.jsx` loads on demand and boots a real Linux 6.8 guest with [v86](https://github.com/copy/v86), an x86 emulator compiled to WebAssembly. `@xterm/xterm` renders the terminal over the emulator's serial port. `DesktopWindow.jsx` provides the draggable/maximizable window chrome shared by the Terminal, Files, Notes, and Welcome apps. `linuxFiles.js` reads and writes the guest's `/mnt` 9p filesystem so Files and Notes share one filesystem with the terminal. Closing pauses the emulator; it does not destroy it until the page navigates away, so reopening resumes the same session.

The guest kernel, BusyBox root filesystem, and BIOS images live in `public/linux/` and are fetched only when the desktop opens; `public/linux/NOTICE.txt` credits their licenses. Networking is disabled in the emulator configuration, so nothing the guest does can reach the network.

`play invaders` (via the Welcome window's arcade link) sends an open request to the existing arcade; it never duplicates the game. See `SANDBOX_INTEGRATION_PLAN.md` for the implementation history, measured bundle sizes, and verification notes.

### Earlier computer prototype (retained, not mounted)

Before the Linux desktop, the sandbox was a JavaScript-simulated terminal with a writable virtual filesystem, a text editor, and an isolated worker that could run small JavaScript snippets. That code (`SandboxWorkspace.jsx`, `SandboxPreview.jsx`, `SandboxFileEditor.jsx`, and `src/lib/sandbox/`) remains in the repository for reference but `SandboxSection.jsx` no longer imports it, so it does not ship to visitors. `scripts/check-sandbox.cjs` and `scripts/check-computer.cjs` exercise that earlier UI and will not pass against the live page.
