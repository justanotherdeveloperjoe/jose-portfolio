<div align="center">

# Jose Sanchez — Front-End Developer

**Fast, responsive interfaces for real businesses, from first pixel to launch-ready.**<br>
Portfolio covering nutrition, industrial, fitness, food, e-commerce, media, real estate and logistics.

<br>

[![Contact](https://img.shields.io/badge/Contact_me-4fd1ff?style=for-the-badge&logo=protonmail&logoColor=black)](mailto:devilfruitd3v@proton.me)
![Available](https://img.shields.io/badge/available-freelance_/_remote-22c55e?style=for-the-badge)

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS](https://img.shields.io/badge/Hand--written_CSS-1572B6?style=flat-square&logo=css&logoColor=white)

<br>

<img src="docs/preview.jpg" alt="Portfolio on desktop and mobile" width="100%">

</div>

<br>

## Current studio portfolio

[View the live portfolio](https://darkslateblue-eagle-516041.hostingersite.com/) · [Open the sandbox section](https://darkslateblue-eagle-516041.hostingersite.com/#sandbox)

The default route shows the editorial portfolio: hero and project deck, selected work, interactive playground and arcade, Monterrey postcard, learning cards, sandbox, and contact. The previous design remains available at `?view=original`.

### Jose's sandbox

Find **Open sandbox** below the learning cards, or visit `#sandbox`. The workspace loads only when opened. It includes a small simulated terminal and three editable HTML/CSS examples: button, card, and postcard. It runs in the browser and does not boot Linux.

Try `help`, `ls projects`, `cat learning/react.txt`, `open logistics`, `learn python`, `edit postcard`, `theme cream`, or `play invaders`. Ordinary buttons provide starting points without typing. The arcade command reveals the existing game without starting or resetting a round.

The editor applies changes with **Run preview**. **Reset example** restores a template and offers undo. Drafts, history, and the selected view survive closing during the page session; reloading clears them. Preview HTML is sanitized with DOMPurify and rendered in an isolated iframe. Scripts, external resources, forms, and navigation are disabled. HTML and CSS are limited to 20 KB each. Keyboard Escape closes the workspace from its controls; reduced motion disables its reveal animation.

Edit project content in `src/data/projects.js`, learning topics in `src/data/learning.js`, and example templates/help in `src/data/sandbox.js`. UI lives in `src/components/sandbox/`; command and preview logic lives in `src/lib/sandbox/`.

See [the integration plan and implementation report](SANDBOX_INTEGRATION_PLAN.md). The older [Desk Mode proposal](DESK_MODE_PLAN.md) is a separate, unimplemented desktop-window concept.

### Checks

```bash
npm run test:sandbox
npm run test:arcade
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another terminal, with Playwright and Chromium available:
node scripts/check-sandbox.cjs
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The browser check defaults to `http://127.0.0.1:4173`; set `SANDBOX_URL` to override it. Set `PLAYWRIGHT_MODULE` to reuse another Playwright installation if it is not locally resolvable. Playwright is a testing prerequisite, not a shipped dependency.

The browser checks cover deferred loading, command history, drafts/reset, isolated previews, reduced motion, responsive layouts, touch, focus, arcade navigation, failed-download recovery, and the original route. Chromium was verified; Firefox, WebKit, physical mobile devices, and a manual screen-reader pass remain unverified.

## <img src="docs/icons/layout-template.svg" width="24" height="24" align="top" alt=""> Original view (`?view=original`)

| | |
|---|---|
| <img src="docs/icons/clapperboard.svg" width="18" height="18" align="top" alt=""> **Intro sequence** | Plays once, then reveals the **corner frame**, a fixed overlay that tracks the active project and links to the others. |
| <img src="docs/icons/clock.svg" width="18" height="18" align="top" alt=""> **Hero** | Live local clock, magnetic buttons, and quick stats. |
| <img src="docs/icons/layout-grid.svg" width="18" height="18" align="top" alt=""> **Work index + case studies** | One section per project, all driven by `src/data/projects.js`. Each shows a real screenshot, or a styled mini-page mock when there's no screenshot yet. |
| <img src="docs/icons/hammer.svg" width="18" height="18" align="top" alt=""> **How I Build** | The process, placed between the case studies. |
| <img src="docs/icons/flask-conical.svg" width="18" height="18" align="top" alt=""> **Labs** | "Things I built to understand how they work." |
| <img src="docs/icons/accessibility.svg" width="18" height="18" align="top" alt=""> **Motion-aware** | Scroll reveals via `useInView` / `useActiveSection`, turned off for `prefers-reduced-motion`. |

## <img src="docs/icons/square-plus.svg" width="24" height="24" align="top" alt=""> Add or update a project

Edit `src/data/projects.js`. Each entry sets:

| Field | Purpose |
|---|---|
| `name`, `category`, `blurb`, `tags` | Card content |
| `status` | `live` or `soon` |
| `url`, `screenshot` | Live link and image (screenshots go in `public/screenshots/`) |
| `accent`, `accent2`, `theme` | Per-project colors |
| `mock` | Mini-page shown until a screenshot exists |

## <img src="docs/icons/rocket.svg" width="24" height="24" align="top" alt=""> Run locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build → dist/
npm run preview   # serve the build
```

## <img src="docs/icons/folder-tree.svg" width="24" height="24" align="top" alt=""> Project structure

```
index.html                 Page shell + meta
src/
  main.jsx · App.jsx       Entry + default/original view selection
  index.css                Base and original-view styles
  studio*.css              Default editorial portfolio styles
  data/projects.js         Case studies (the single source of project content)
  data/learning.js         Shared learning cards and terminal notes
  data/sandbox.js          Editable examples, command help, aliases
  data/growth.js           Labs, skills and "currently building" content
  components/              Hero, WorkIndex, ProjectSection, CornerFrame, IntroSequence,
                           HowIBuild, LabsSection, Footer, Magnetic, StickyNav, …
  components/sandbox/      On-demand terminal and HTML/CSS editor
  lib/sandbox/             Command parser, virtual files, preview construction
  hooks/                   useInView, useActiveSection, useLocalClock, useReducedMotion
public/screenshots/        Live-site screenshots
docs/                      README preview
DESK_MODE_PLAN.md          Plan for an optional "desktop OS" mode (not built yet)
SANDBOX_INTEGRATION_PLAN.md Integration map and shipped sandbox verification
```

> [!NOTE]
> Some components aren't mounted in `App.jsx` right now (`GainzTakeover`, `GsapJoke`, `CurrentlyBuildingSection`, `WhatIUseSection`). They're kept so they can be brought back later.

## <img src="docs/icons/globe.svg" width="24" height="24" align="top" alt=""> Deployment

`npm run build` produces a static `dist/` folder, which can go on any static host (Netlify, Vercel, GitHub Pages).
