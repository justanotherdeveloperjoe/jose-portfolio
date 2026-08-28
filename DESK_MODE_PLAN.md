# Desk Mode — Implementation Plan

An optional, toggle-able "desktop OS" layer over the existing portfolio. Inspired by
Windows-style portfolio sites (draggable windows, taskbar, window manager), but scoped
down to fit this site honestly: no games, no Paint, no file explorer, no fake apps — just
the real project data we already have, presented in a different, more playful chrome.

The scroll-based site stays the default, primary experience. Desk Mode is a secondary
layer for visitors who want to poke at it — proof of React/state-management skill, not
the thing every visitor is forced through.

---

## 1. What's in scope

- A **window manager**: open, close, focus, minimize, drag, resize.
- A **taskbar**: launch icons, running-app indicators, click-to-focus/restore.
- **Windows show real content only** — the same 7 project case studies (name, category,
  blurb, tags, screenshot/mock) plus a Resume/About window and a Contact window. All of
  it already exists in `src/data/projects.js` — no new copy to write, no new fabrication
  risk.
- Desktop-only. Mobile/tablet visitors get a short notice ("Desk Mode works best on a
  larger screen") and stay on the normal scroll site — same call the reference project
  made, and it's the honest one: a drag/resize window manager on a touch screen is a
  worse experience, not a novelty.

## 2. What's explicitly out of scope

- Boot animation, lock screen, Start menu, system tray, clock/calendar flyouts
- Games (Snake, Tic-Tac-Toe, Memory Match)
- Paint, Code Editor, File Explorer, Recycle Bin
- Wallpaper picker / personalization system
- Any content that isn't already real, verified project/resume data

These are the parts of the reference that are pure novelty padding — fun to build, but
they compete with the actual portfolio content for attention and add maintenance surface
without proving anything the rest of the site doesn't already prove.

## 3. Entry point — needs your decision

Two options, not both:

**A. Persistent toggle (recommended default)**
A small button in the corner-frame area, e.g. `⧉ DESK MODE`, always visible once past
the hero. Reads as a real, intentional feature. Straightforward to build and test.

**B. Hidden trigger**
E.g. triple-click the "JVS®" corner-frame logo, or a small unlabeled icon. More in the
spirit of a "secret desktop," but risks visitors never finding it — which defeats the
point if this is meant to demonstrate a skill to people evaluating the portfolio.

*Recommendation: A.* A hiring manager skimming the site for 90 seconds won't triple-click
random logos. Ship it as a discoverable feature; if you want a delighter, we can still
give the *toggle itself* a small flourish (icon animates in, etc.) without hiding it.

## 4. Architecture

```
src/
├── context/
│   └── WindowManagerContext.jsx   # open windows, z-index, focus, position, minimize
├── components/
│   └── desk/
│       ├── DeskMode.jsx           # top-level overlay: mounts when toggled on
│       ├── Desktop.jsx            # background + desktop icons
│       ├── DesktopIcon.jsx        # double-click-to-open icon
│       ├── Taskbar.jsx            # launch bar + running windows
│       ├── Window.jsx             # generic draggable/resizable window chrome
│       └── apps/
│           ├── ProjectApp.jsx     # renders one project's case study in a window
│           ├── ResumeApp.jsx      # static resume/about content
│           └── ContactApp.jsx     # mailto CTA, same as existing Footer
└── data/
    └── deskApps.js                # registry: id, title, icon, accent, component
```

### WindowManagerContext

State shape:

```js
{
  windows: [
    { id, appId, title, x, y, width, height, zIndex, minimized, focused }
  ],
  openApp(appId),      // opens or focuses if already open
  closeWindow(id),
  minimizeWindow(id),
  focusWindow(id),
  moveWindow(id, x, y),
  resizeWindow(id, width, height),
}
```

Z-index/focus: keep a single incrementing counter; focusing a window sets its `zIndex`
to `counter++`. Simple, no sorting needed on every render.

### Window.jsx (the core reusable piece)

- Title bar: icon, title, minimize/close buttons. Pointer-down on title bar starts drag
  (track offset, update `x/y` via the context on `pointermove`, release on `pointerup`).
- Resize handle: bottom-right corner, same pointer-event pattern, clamped to a sane
  min-width/min-height.
- Click anywhere in the window body focuses it (brings to front).
- Respects `prefers-reduced-motion`: open/close gets an instant show/hide instead of a
  scale/fade transition when reduced motion is on — consistent with how the rest of the
  site already handles this.

### Taskbar.jsx

- Left: launch icons for each entry in `deskApps.js` (7 projects + Resume + Contact).
- Right: a list of currently-open windows (icon + title), click to focus/restore if
  minimized. Active window gets a highlighted underline, matching the existing
  accent-per-project color already used elsewhere on the site.

### deskApps.js registry

```js
export const deskApps = [
  { id: 'p01', title: 'Nutrióloga Allende', icon: '🩺', kind: 'project', projectId: 'p01' },
  // ...one entry per project, generated from projects.js so it can't drift out of sync
  { id: 'resume', title: 'Resume', icon: '📄', kind: 'resume' },
  { id: 'contact', title: 'Contact', icon: '✉️', kind: 'contact' },
];
```

Generate the project entries programmatically from `projects.js` (`projects.map(...)`)
rather than hand-duplicating them — same principle as the dynamic project counts we
already fixed earlier (no hardcoded numbers that go stale).

## 5. Visual direction

Reuse the site's existing design language instead of inventing a new one:

- Desktop background: the same dark grid pattern already used site-wide, maybe dimmed
  further so windows pop.
- Window chrome: dark panel (`var(--panel)`), 1px border (`var(--line-strong)`), mono
  font for the title bar — consistent with the `.mock-browser` chrome already built for
  the project screenshots.
- Each project's window uses that project's own `--case` accent color for its title bar
  underline/active state — same per-project color system already in place.
- Taskbar: fixed to the bottom, same panel/border treatment.

No new color palette, no new typography — Desk Mode should look like *this site's* OS,
not a generic Windows skin.

## 6. Build order

1. `WindowManagerContext` + `Window.jsx` with drag + focus (no resize yet) — prove the
   core interaction feels good with one hardcoded test window.
2. `Taskbar.jsx` + `deskApps.js` registry + `DeskMode.jsx` toggle wiring.
3. `ProjectApp.jsx` — render real project data inside a window (reuse existing blurb/
   tags/screenshot markup, not a copy-paste fork of `ProjectSection`).
4. Add resize handle to `Window.jsx`.
5. `ResumeApp.jsx` / `ContactApp.jsx`.
6. Mobile guard: detect small viewport, show the "works best on desktop" notice instead
   of mounting Desk Mode.
7. Polish pass: minimize/restore animation, reduced-motion handling, keyboard escape to
   close focused window.

## 7. Open questions for you

- **Entry point:** persistent toggle button, or hidden trigger? (Section 3 — recommend
  persistent.)
- **Desktop icons:** should the desktop itself also show icons (double-click to open,
  like a real desktop), or is the taskbar alone enough? Icons add a bit more "OS" feel
  but are one more thing to lay out and keep tidy.
- **Scope check:** Resume + Contact + 7 projects = 9 apps total. Anything else you want
  represented as an app (e.g. a "Labs" window mirroring the Labs section)?
