# Portfolio visual assets

The studio design uses local assets so visitors do not need third-party font or image requests.

- **Bricolage Grotesque:** variable Latin WOFF2 from [Google Fonts](https://fonts.google.com/specimen/Bricolage+Grotesque), designed by Mathieu Triay. License: SIL Open Font License, included at `public/fonts/OFL.txt`. The Latin subset includes Spanish accented characters.
- **Quinta El Roble photograph:** pool and terrace image from the [Propiedades Allende](https://propiedadesallende.com) project gallery, stored at `public/artwork/allende-property.webp`. [Original image](https://assets.zyrosite.com/BlW7BFDF77mnFapt/2-FauBMZGvVAO2Mh2M.png).
- **AFH mobile preview:** screenshot of [afh.mx](https://afh.mx) at 390 × 844 pixels, captured September 27, 2026, stored at `public/screenshots/afh-mobile.jpg`.
- **Comedy artwork:** CSS crop of the existing El Sótano Cómico project screenshot; the original screenshot remains intact.
- **Mountain footer and route diagram:** inline SVG in `src/components/ProjectVisuals.jsx`.

The visual additions are styled in `src/studio-editorial.css`. Hero entrance animations and pointer tilt respect reduced-motion preferences; tilt also requires a fine pointer and hover support.

## Interactive story and learning scenes

- `MonterreyPostcard.jsx` uses GSAP and ScrollTrigger for a single layered entrance, pointer depth, day/night lighting, and a reversible personal note. Hidden faces are inert, and the flip button remains available on both sides.
- `LearningScenes.jsx` contains the JavaScript terminal, React state demo, SQL sample query, Python sorting illustration, and AWS weather scene. SQL and Python use local sample data; they do not connect to a database or access visitor files. The weather is illustrative.
- `useSceneMotion.js` scopes the finite GSAP timelines to each scene, settles them when offscreen or the tab is hidden, and removes them when reduced motion is enabled. The underlying results are React state and remain usable without animation.
- Edit study topics and goals in `src/data/learning.js`; edit sample interactions in `LearningScenes.jsx`.

## Off hours arcade

`SpaceArcade.jsx` adds a collapsible, optional arcade below the playground experiments. `spaceGame.js` holds the original pixel sprite patterns and game simulation; it uses Canvas 2D without image downloads or additional libraries.

Controls: arrows or A/D to move, Space to fire, P/Escape to pause, or hold the on-screen controls. The game pauses when its screen leaves view, focus leaves the game panel, or the browser tab becomes hidden. Closing cancels the animation loop. Best score lasts for the current page session. Reduced motion removes the reveal transition and sprite-frame animation; gameplay movement starts only after choosing to play.

Run `npm run test:arcade` for the game simulation checks (movement bounds, collisions, scoring, waves, damage immunity, and game-over).

## Jose's sandbox

The optional section below learning uses the existing charcoal, cream, lime, and type choices. It adds no downloaded artwork or font. The three original editor templates are native HTML/CSS, including a small landscape that echoes the Monterrey postcard.

`SandboxSection.jsx` holds the invitation and retained page-session state. The workspace and its styles load on demand; closing makes it inert immediately, then unmounts it after the 240 ms collapse. Reduced motion closes it immediately. There are no sandbox animation loops or listeners before opening.

The terminal reads canonical project and learning data. `play invaders` sends an open request to the existing arcade; it never duplicates the game. DOMPurify is the only new runtime dependency and is included in the deferred workspace. Preview documents have an empty iframe sandbox and restrictive CSP, with no script execution or outside resources.

The production build adds about 1.64 KB gzip of initial JavaScript and 0.49 KB of initial CSS. Opening loads another 18.23 KB gzip of JavaScript and 2.05 KB of CSS. See `SANDBOX_INTEGRATION_PLAN.md` for verification, limitations, and the implementation map.
