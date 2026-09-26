# Jose Sanchez — Front-End Developer Portfolio

Portfolio site for Jose Villarreal Sanchez, a front-end developer who builds fast, responsive sites for real businesses in health, industrial, fitness, food, e-commerce, media, real estate and logistics.

Built with **React 18 + Vite 5**. No UI framework: the styling is hand-written CSS in `src/index.css`.

## What's on the page

- **Intro sequence** that plays once, then reveals the **corner frame**, a fixed overlay that shows the active project and links to the others.
- **Hero** with a live local clock and magnetic buttons.
- **Work index** plus one **project section per case study**. They're all driven from `src/data/projects.js`, and each has a real screenshot or a styled mock when no screenshot exists yet.
- **How I Build** (process), **Labs** ("things I built to understand how they work") and a **footer** with the contact CTA.
- Scroll-driven reveals via `useInView` / `useActiveSection`. Motion is disabled for `prefers-reduced-motion` visitors.

## Adding or updating a project

Edit `src/data/projects.js`. Each entry sets its name, category, `status` (`live` / `soon`), `url`, `screenshot`, accent colors, blurb and tags. If there's no screenshot yet, it also takes a `mock` block that the section renders as a mini page. Screenshots go in `public/screenshots/`.

## Project structure

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
DESK_MODE_PLAN.md          Plan for an optional "desktop OS" mode (not built yet)
```

Some components aren't mounted in `App.jsx` right now (`GainzTakeover`, `GsapJoke`, `CurrentlyBuildingSection`, `WhatIUseSection`). They're kept so they can be brought back later.

## Running locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build → dist/
npm run preview   # serve the build
```

## Deployment

`npm run build` produces a static `dist/` folder, which can go on any static host (Netlify, Vercel, GitHub Pages).
