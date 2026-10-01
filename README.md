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

The default route shows the editorial portfolio: hero and project deck, selected work, interactive playground and arcade, Monterrey postcard, learning cards, sandbox, Work With Me services, and contact. The previous design remains available at `?view=original`.

### Work With Me services

The section at `#services` offers **Launch from $300 USD**, **Business Website from $650 USD**, and **Custom Build by quote**. Each connects deliverables to an existing project: Smashouse, AFH Logistics, and El Sótano Cómico. Interaction increases by tier, with quiet idle states and a reduced-motion fallback. Inquiry links open an email draft for the selected service.

Edit prices, deliverables, and example assignments in `src/data/services.js`. Project links and screenshots remain in `src/data/projects.js`. Smashouse uses the supplied working HTTP URL and a local screenshot; its HTTPS endpoint returned a certificate error when checked on October 1, 2026. See [services implementation notes](docs/services-section.md) for behavior, files, and checks. This addition has not yet been deployed to Hostinger.

### Jose's sandbox: a little Linux desktop

Find **Open desktop** below the learning cards, or visit `#sandbox`. It loads only when opened, then boots a real Linux 6.8 guest in the browser with [v86](https://github.com/copy/v86), an x86 emulator compiled to WebAssembly — not a simulated shell. Closing pauses the emulator; reopening during the same page visit resumes it where you left off.

One dock opens or focuses five apps: **Terminal** (a real Linux shell rendered with `@xterm/xterm`), **Files**, **Notes**, **Monitor**, and **Appearance**. Files and Notes share the guest's `/mnt` folder with the terminal. Monitor reads guest memory, uptime, and processes while open. Appearance offers three wallpapers, three accent colors, and terminal text sizes from 12–18 px; preferences stay in this browser across reloads. A small help button opens Welcome, with orientation, the arcade link, and restart controls. Windows drag by their title bar and can be centered or maximized. Try `uname -a`, `ls /mnt`, `sh hello.sh`, or `echo "hello" > /mnt/idea.txt`.

Monitor and terminal resizing use a separate guest serial port, leaving the visitor's terminal input intact. Polling stops when Monitor closes, the desktop pauses/closes, or the browser tab is hidden. Memory values describe the Linux guest, not the visitor's computer. The guest has 64 MB allocated; usable memory is lower because Linux reserves some of it.

**Utilities** adds one dock launcher for four browser tools, each in a movable window:

- **Calculator:** typed arithmetic, parentheses, percentages, and eight recent calculations. Enter calculates; Escape clears. Percent divides a value by 100.
- **Calendar:** month navigation, today highlighting, and up to 100 personal reminders saved in this browser. These are local notes, without notifications or account sync.
- **Focus Timer:** a 1–180 minute countdown, stopwatch, and optional completion sound. It keeps time while its window is closed or the tab is hidden. Closing or pausing the desktop pauses it; use Resume timer to continue.
- **Sketchpad:** pen colors and sizes, eraser, undo, clear confirmation, and PNG download. Mouse, pen, and touch use the same canvas. Drawings remain during the page visit, including after closing their window; download before reloading.

The utilities add no dependencies or external requests. Their code loads with the deferred desktop. Closing an app keeps its state for this visit; restarting Linux only resets the guest and its files.

Networking is disabled in the emulator, so nothing inside the guest can reach the network. Files live only in the current browser tab; download anything worth keeping, since reloading the page or clearing the session starts a fresh machine. The Welcome window's **Restart Linux…** does the same on demand, after a confirmation. `public/linux/NOTICE.txt` (linked from the Welcome window) credits the open-source guest image, BIOS, and terminal library.

Edit project content in `src/data/projects.js` and learning topics in `src/data/learning.js` — both feed the guest's `projects.txt`/`learning.txt` files. UI and filesystem-bridge code live in `src/components/sandbox/` (`SandboxSection.jsx`, `LinuxDesktop.jsx`, `DesktopWindow.jsx`, `linuxFiles.js`).

See [the integration plan and implementation report](SANDBOX_INTEGRATION_PLAN.md) for the full history, including the earlier JavaScript-simulated prototype that this replaced. The older [Desk Mode proposal](DESK_MODE_PLAN.md) is a separate, unimplemented desktop-window concept.

### Checks

```bash
npm run test:arcade
npm run test:utilities
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another terminal, with Playwright and Chromium available:
node scripts/check-linux.cjs
node scripts/check-utilities.cjs
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The browser check defaults to `http://127.0.0.1:4173`; set `SANDBOX_URL` to override it. Set `PLAYWRIGHT_MODULE` to reuse another Playwright installation if it is not locally resolvable. Playwright is a testing prerequisite, not a shipped dependency. Booting the guest kernel under Chromium takes real time (tens of seconds), so this check runs slower than the rest.

The browser check covers deferred loading, booting to a shell prompt, terminal/Files/Notes sharing one filesystem, downloads, window dragging, pause/resume, close/reopen without rebooting, the arcade bridge, responsive layouts, focus on close, the original route, and failed-chunk-download recovery. Chromium was verified; Firefox, WebKit, physical mobile devices, and a manual screen-reader pass remain unverified. `npm run test:sandbox`, `node scripts/check-sandbox.cjs`, and `node scripts/check-computer.cjs` still run, but they exercise the earlier JavaScript-simulated prototype described in `docs/visual-assets.md`; that code is retained in the repo but `SandboxSection.jsx` no longer mounts it, so those checks say nothing about the live page.

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
