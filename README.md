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

## <img src="docs/icons/layout-template.svg" width="24" height="24" align="top" alt=""> What's on the page

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
  main.jsx · App.jsx       Entry + page composition
  index.css                All styles
  data/projects.js         Case studies (the single source of project content)
  data/growth.js           Labs, skills and "currently building" content
  components/              Hero, WorkIndex, ProjectSection, CornerFrame, IntroSequence,
                           HowIBuild, LabsSection, Footer, Magnetic, StickyNav, …
  hooks/                   useInView, useActiveSection, useLocalClock, useReducedMotion
public/screenshots/        Live-site screenshots
docs/                      README preview
DESK_MODE_PLAN.md          Plan for an optional "desktop OS" mode (not built yet)
```

> [!NOTE]
> Some components aren't mounted in `App.jsx` right now (`GainzTakeover`, `GsapJoke`, `CurrentlyBuildingSection`, `WhatIUseSection`). They're kept so they can be brought back later.

## <img src="docs/icons/globe.svg" width="24" height="24" align="top" alt=""> Deployment

`npm run build` produces a static `dist/` folder, which can go on any static host (Netlify, Vercel, GitHub Pages).
