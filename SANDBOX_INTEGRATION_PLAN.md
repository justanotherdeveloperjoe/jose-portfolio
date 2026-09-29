# Portfolio sandbox: integration plan

**Status:** the Linux desktop and Utilities release is published to GitHub and Hostinger as of September 29, 2026. It supersedes the computer-refinement revision below, which is retained in the repository but no longer mounted on the page.

**Prepared:** September 28, 2026.  
**Direction:** a lightweight, optional workspace lower on the page, built around Jose's work and ongoing learning.

## Linux desktop — current release

**Live site:** [Jose's portfolio](https://darkslateblue-eagle-516041.hostingersite.com/#sandbox). **Source release:** [`3625f7a`](https://github.com/justanotherdeveloperjoe/jose-portfolio/commit/3625f7a).

Published the production build to the existing Hostinger site after the build and Node checks passed. Assets were uploaded and verified before changing `index.html`; previous hashed assets were retained. Code, styles, fonts, Linux images, WebAssembly binaries, and the entry page match the local build. Hostinger optimizes JPEGs, so their served dimensions were verified.

Both Chromium browser suites passed against the live Hostinger URL: Linux boot, shared files, Monitor, Appearance, pause/resume, arcade, loading recovery, all four utilities, saved reminders, timer completion, touch drawing, PNG export, and mobile layouts.

The sandbox boots a real Linux 6.8 guest in the browser with [v86](https://github.com/copy/v86), an x86 emulator compiled to WebAssembly. `@xterm/xterm` renders the terminal over the guest's serial port. A draggable-window desktop (`DesktopWindow.jsx`) hosts five dock apps: **Terminal**, **Files**, **Notes**, **Monitor**, and **Appearance**. Welcome is available from the top bar's help button. Files and Notes read and write the guest's `/mnt` 9p filesystem through `linuxFiles.js`.

Implemented behavior:

- The desktop loads only when opened (`React.lazy`), then downloads the guest kernel (`public/linux/buildroot-bzimage68.bin`, a BusyBox-based Linux 6.8 image), BIOS/VGA BIOS, and the v86 WebAssembly runtime — about 13 MB total, once per visit.
- Closing the panel pauses the emulator (`vm.stop()`) rather than destroying it, so reopening during the same page visit resumes the same session instantly instead of rebooting. The panel also pauses on a hidden tab and resumes on return, if still open.
- Windows drag by their title bar, maximize, and raise on focus/taskbar click. The terminal resizes the guest's TTY (`stty cols/rows`) to match its container.
- Files can be opened into Notes (capped at 128 KB), edited, saved back with Ctrl+S, or downloaded. New files created from the terminal appear in Files after a short debounce on the emulator's `9p-write-end` event.
- Networking is disabled in the emulator configuration (no NIC device), so nothing inside the guest can reach the network. Memory is capped at 64 MB.
- A restart flow (Welcome → **Restart Linux…**) asks for confirmation, then clears the session and boots a fresh guest. A stalled boot (60 s without reaching a shell prompt) or a WASM/download failure surfaces a retry overlay instead of a silently broken page.

### Desktop polish and new apps

The desktop uses one dock with a dot for each open app and an accent highlight for the active app. Launching an open app raises its existing window. Matching SVG line icons, cream window surfaces, charcoal chrome, softer shadows, and three static wallpapers keep the desktop consistent with the site. Terminal shortcuts appear only when Terminal is active. The drag handler no longer shadows the browser's `window` object; windows are constrained to the workspace and the Center control uses their actual dimensions.

| File | Responsibility |
| --- | --- |
| `DesktopIcon.jsx` | Shared SVG app and window-control icons |
| `DesktopPolish.css` | Desktop theme, dock, Monitor, Appearance, mobile and reduced-motion styles |
| `DesktopAppearance.jsx` | Validated browser preferences: wallpaper, accent, terminal font size |
| `DesktopMonitor.jsx` | Live memory, uptime, and process display; stops polling when hidden or paused |
| `guestControl.js` | Separate serial connection for guest metrics and TTY sizing |

Monitor reads `/proc/meminfo`, `/proc/uptime`, and `ps` through a detached, noninteractive shell on the second serial port. It samples every 2.5 seconds while open and running, with bounded output and a six-second request timeout. It reports usable guest memory, which is lower than the 64 MB allocated to the VM. Resizing uses this same connection, so neither monitoring nor font changes inject text into the visitor's command line. Appearance preferences persist in localStorage; Linux files remain session-only. No dependencies were added for this refinement.

### Utilities — September 29, 2026

One **Utilities** dock button groups Calculator, Calendar, Focus Timer, and Sketchpad. Each uses the existing window manager and matching inline SVG icons. The four components mount on their first launch and keep state when closed. The Utilities dock indicator also represents its open child windows.

| Component | Behavior and storage |
| --- | --- |
| `DesktopCalculator.jsx` | Arithmetic parser in `utilityMath.js`, no eval; eight calculations kept for the visit |
| `DesktopCalendar.jsx` | Monday-first month grid, leap years, today shortcut, up to 100 reminders in localStorage |
| `DesktopTimer.jsx` | Countdown/stopwatch based on timestamps, optional Web Audio chime, pauses on desktop close/pause |
| `DesktopSketchpad.jsx` | Fixed-resolution canvas with pointer input, bounded stroke history, eraser, undo, clear confirmation, PNG export |
| `DesktopUtilities.jsx` / `.css` | App launcher, retained windows, shared utility styling and mobile layouts |

The timer keeps time in hidden tabs while display updates stop. It continues if its own window closes; closing the desktop pauses it until manually resumed. Sketches and calculator history stay only for the page visit. Calendar reminders persist independently of the Linux guest. These browser apps make no network requests and require no additional libraries. The initial page bundles remain unchanged; the utilities add about 6.8 KB gzip to the deferred desktop's combined JavaScript and CSS.

Checks: `npm run test:utilities` covers arithmetic precedence, malformed input, division by zero, leap years, and timestamp/pause calculations. `scripts/check-utilities.cjs` covers keyboard calculation, history retention, reminders across reloads, countdown completion, stopwatch/desktop pause, sketch retention/undo/download, and 320/390/768/1440 px layouts. Existing Linux desktop checks still cover shared files, Monitor, Appearance, and the arcade connection.

### Emulator readiness

The emulator object is constructed synchronously, but its inner machine and 9p filesystem are only wired up asynchronously once the WASM module finishes loading and the library's own `emulator-ready` event fires. Two other effects (the Files/Notes refresh effect and the active/paused-tracking effect) ran on mount and called VM methods (`fs9p.SearchPath`, `.run()`, `.stop()`) before that event had ever fired, throwing on every single open and tripping the lazy-load error boundary before Linux ever got a chance to boot. The fix tracks readiness with a ref set only inside the `emulator-ready` handler, and every other call site checks it first; destroy calls made before that point are now caught rather than left as unhandled rejections. Verified with a from-scratch Playwright run against the production build (see below) before and after the fix.

### Measured production build

| Asset | Gzip |
| --- | --- |
| Initial JavaScript | 120.08 KB |
| Initial CSS (unchanged by this revision) | 22.23 KB |
| Deferred desktop JavaScript (v86 wrapper, xterm.js, apps and utilities) | 191.13 KB |
| Deferred desktop CSS | 7.84 KB |
| Guest kernel + BIOS + v86 WebAssembly (fetched on open, not gzip-measured by the build) | ≈ 13 MB |

New dependencies: `v86` (BSD-2-Clause), `@xterm/xterm` and `@xterm/addon-fit` (MIT). `public/linux/NOTICE.txt`, linked from the Welcome window, credits the guest kernel/BusyBox (GPL-2.0), SeaBIOS (LGPL), v86, and xterm.js.

### Verification completed

`scripts/check-linux.cjs` (Chromium, against a production build served by `vite preview`) covers: no desktop code loads before open; boot reaches a shell prompt; terminal commands produce output; a file created in the terminal appears in Files and opens into Notes with matching content; an edit saved in Notes round-trips back through `cat` in the terminal; downloading a file from Files; dragging a window; pause/resume; closing and reopening without a reboot; the Welcome window's restart-confirmation dialog and arcade bridge; 320/390/768/1440 px layouts; focus returning to the launcher on close; `?view=original` never mounting the sandbox; and recovery from a failed deferred-chunk download. No console or page errors during the run.

**Remaining coverage:** Firefox, WebKit, and physical devices are untested, as is a manual screen-reader pass. Booting a full kernel under WebAssembly is CPU-bound; a slow or throttled device will take longer to reach a shell prompt than the Chromium desktop environment used here.

**Practical limits:** this is a genuine but small Linux guest — 64 MB of RAM, no networking, and files that live only in the current tab. It is not backed by any server, and nothing typed into it leaves the browser. The linked live site now serves this desktop and its four Utilities apps.

## Computer refinement — earlier local revision (retained, not mounted)

Superseded by the Linux desktop above. `SandboxSection.jsx` no longer imports this code (`SandboxWorkspace.jsx`, `SandboxPreview.jsx`, `SandboxFileEditor.jsx`, `src/lib/sandbox/`); it is kept in the repository for reference, and `scripts/check-sandbox.cjs`/`scripts/check-computer.cjs` still exercise it in isolation, but neither runs against the live page anymore.

The latest request is for a computer visitors can use. This revision replaces the two-view dashboard with a single terminal screen, window controls, inline prompt/output, colored directory listings, and compact command shortcuts. Editors open through commands and return to the same session.

Implemented additions:

- Writable `/home/guest` (`~`) with `mkdir`, `touch`, `echo` redirection, `cp`, `mv`, `rm`, `tree`, and `download`.
- A file editor with Save, Save & return, and Discard & return. Ctrl+S saves; Escape saves and returns.
- Browser-local saved files, bounded to 20 KB per file, 128 KB total, and 100 combined files/folders. Corrupt or blocked storage falls back to a fresh session. Portfolio directories are read-only.
- `run hello.js` executes a saved script; `js 2 + 2` evaluates JavaScript. Each execution uses a worker inside an opaque-origin iframe, separate from the HTML/CSS preview. CSP blocks outside resources. The host handles messages only from that frame, with a per-run token and bounded text output.
- A two-second host deadline plus Ctrl+C/Stop, close, and hidden-tab cancellation. Worker code cannot reach the page DOM or portfolio storage. Browser memory is not strictly metered; this is intended for small experiments.
- Path/command completion through Alt+Right or a visible button. Tab remains available for ordinary keyboard navigation. History, Ctrl+L, `whoami`, `date`, and `exit` round out the session.

No new dependency or initial runtime download is needed. JavaScript evaluation happens only in the isolated worker, never in the host page. The original no-script restriction continues to apply to the HTML/CSS preview. [Worker behavior and CSP inheritance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

The updated production build measures 120.12 KB gzip of initial JavaScript and 22.23 KB of initial CSS. The deferred computer uses 23.97 KB gzip of JavaScript and 2.30 KB of CSS, including the retained HTML/CSS preview and sanitizer. It remains within the original deferred budgets.

Node checks cover file operations, path boundaries, storage validation, quotas, aliases, shared content, and completion. Chromium checks cover the complete create/edit/run/download/reload workflow, blocked networking, infinite loops, cancellation, blocked storage, and responsive layouts. The retained preview/arcade suite also passes.

This earlier implementation is retained in GitHub for reference and is not mounted in the published site. The report and sections below document the original first release.

## Implementation report — September 28, 2026

**Live site:** [Jose's portfolio](https://darkslateblue-eagle-516041.hostingersite.com/#sandbox). **Source release:** [`e6db5c7`](https://github.com/justanotherdeveloperjoe/jose-portfolio/commit/e6db5c7).

Published the static production build to the existing Hostinger Agency site. Assets were uploaded and verified before switching the entry page; previous hashed assets were retained. The complete sandbox browser check also passed against the live URL. Hostinger optimizes JPEGs, so their served dimensions were checked; code, styles, fonts, and the entry page matched the local build exactly.

The first release below is implemented: an optional section after learning and before contact, a deferred terminal, three editable HTML/CSS previews, shared learning/project data, and a bridge to the existing arcade. The numbered sections preserve the integration design and rationale.

### Shipped behavior

- Familiar commands, virtual folders, history, local cream/charcoal palettes, and clickable suggestions.
- Button, card, and postcard examples with explicit Run, Reset, undo, and separate session drafts.
- Sanitized HTML in a restricted iframe; CSS cannot escape its style container. Browser checks blocked script injection, navigation, embeds, forms, and external resource requests.
- A 240 ms inline reveal/collapse, reduced-motion support, focus return, and inert content while closing. The iframe unmounts after collapse.
- The existing arcade opens ready or paused and preserves an active round; a return link brings visitors back.
- Failed module downloads offer **Reload page**. Browsers cache failed imports, so re-creating a lazy component does not reliably retry the download. Reload returns to `#sandbox`; the visitor opens it again.

### Measured production build

| Asset | Fresh baseline, gzip | Implemented, gzip | Added |
| --- | --- | --- | --- |
| Initial JavaScript | 118.47 KB | 120.11 KB | 1.64 KB |
| Initial CSS | 21.74 KB | 22.23 KB | 0.49 KB |
| Deferred workspace JavaScript | — | 18.23 KB | On open |
| Deferred workspace CSS | — | 2.05 KB | On open |

All four budgets were met. The browser network check confirms workspace chunks and the iframe are absent before opening. DOMPurify is included in the deferred JavaScript.

### Verification completed

- Production build; command/path/content/bounds tests; arcade simulation tests.
- Chromium browser checks: lazy loading and failed-download recovery; terminal commands and history; text-only output; draft preservation; template switching, reset and undo; preview containment; runtime reduced motion; focus; project/arcade navigation; 320/390/768/1440 px layouts; emulated mobile touch; original-view smoke check.
- Existing postcard/learning-scene and arcade browser suites, including touch, reduced-motion changes, game controls, and offscreen pausing.
- Desktop and mobile screenshots inspected. Local captures are in the ignored `.preview/` directory.

**Remaining coverage:** Firefox and WebKit are not installed in this environment. Physical mobile devices and manual screen-reader announcements have not been tested. These remain release-review checks, not claims of completed validation.

**Practical limits:** this is a defined command simulation and static HTML/CSS preview, not Linux or a general code runner. Arbitrarily expensive CSS can still burden the browser; source limits and explicit Run reduce accidental work. Closing destroys the preview. Reloading clears page-session drafts. Publication used the existing hosting site without changing its plan or domain.

## 1. The experience

Add **“Jose's sandbox”** after **Currently learning** and before **Contact**. This is the recommended placement: visitors see the work, meet the person, discover what he is learning, then get to experiment themselves.

The section starts as a compact invitation. Selecting **Open sandbox** expands an inline workspace with two views:

- **Explore:** a terminal with a small set of commands for browsing projects and learning notes.
- **Make something:** a small HTML/CSS editor with a preview and a few starting examples.

It should feel like another part of the existing portfolio: charcoal, warm cream, lime accents, restrained borders, and the existing typography. Keep the terminal's monospace type inside the workspace. The surrounding heading retains the site's editorial style.

Suggested section copy:

> **05 / The sandbox**  
> A little room to figure things out.  
> Explore my projects, see what I'm learning, or change a few lines and make something your own.

Inside the workspace, a short label explains **“A browser sandbox with a few familiar commands.”** The terminal resembles a Unix shell but implements a defined command set in JavaScript. It does not boot Linux or run arbitrary system commands.

### First visit

1. The visitor scrolls past the learning cards and sees the invitation.
2. **Open sandbox** loads the workspace and reveals it with a short expansion/fade.
3. A prompt and clickable command suggestions provide an immediate starting point.
4. The visitor explores, switches to an editable example, or opens the existing arcade.
5. **Close sandbox** collapses the workspace and returns focus to its launch button. Drafts survive reopening during the current page session.

Avoid a boot sequence, automatic typing, background sound, or an attention-seeking idle animation. The visitor starts the interaction.

## 2. Current project map

The default site is a React 18 application built with Vite 5. GSAP is already installed for motion. The site currently requires no application backend.

```text
src/main.jsx
└── App.jsx
    ├── StudioPortfolio.jsx                 default experience
    │   ├── Navigation + hero/project deck
    │   ├── Selected work                   #work
    │   ├── Playground                      #playground
    │   │   ├── Motion/responsive/type/theme experiments
    │   │   └── SpaceArcade
    │   ├── About + MonterreyPostcard        #about
    │   ├── LearningSection                 #learning
    │   ├── SandboxSection                  #sandbox — proposed
    │   └── Contact + mountain/footer       #contact
    └── OriginalPortfolio                   ?view=original
```

Relevant existing integration points:

| File | Current responsibility | Planned connection |
| --- | --- | --- |
| `src/components/StudioPortfolio.jsx` | Page composition | Insert section and coordinate arcade navigation |
| `src/components/LearningSection.jsx` | Five learning cards and their content | Extract content into a shared data module |
| `src/components/LearningScenes.jsx` | Interactive language illustrations | Keep existing card interactions; link to learning from terminal |
| `src/data/projects.js` | Canonical project names, slugs, status, URLs, descriptions | Generate project files and navigation actions |
| `src/components/SpaceArcade.jsx` | Existing inline game and its lifecycle | Expose a small external open request |
| `src/components/spaceGame.js` | Game simulation/rendering | Reuse existing game; no second implementation |
| `src/components/MonterreyPostcard.jsx` | Personal story and day/night scene | Existing visual reference for warmth and restraint |
| `src/studio-editorial.css` | Editorial composition and styling | Reuse visual values without adding global overrides |
| `docs/visual-assets.md` | Asset and interaction documentation | Document the new workspace and any dependencies |

`DESK_MODE_PLAN.md` describes an older desktop window-manager proposal. This plan is a separate, smaller feature: one inline workspace that also works on mobile. The older proposal is not a prerequisite. Keep it intact and cross-reference this plan when updating project documentation.

## 3. First-release scope

### Explore: a small terminal

Initial suggested output:

```text
jose@studio:~$ help
Explore the work. Peek at what I'm learning. Try an experiment.

Try: ls projects    cat learning/react.txt    edit button
```

The virtual files come from portfolio content; visitors cannot access the host filesystem.

```text
/
├── about.txt
├── projects/
│   └── <project-slug>.txt
├── learning/
│   ├── javascript.txt
│   ├── react.txt
│   ├── sql.txt
│   ├── python.txt
│   └── aws.txt
└── experiments/
    ├── button/
    ├── card/
    └── postcard/
```

| Command | Behavior |
| --- | --- |
| `help` | Explain supported commands and show clickable examples |
| `pwd`, `ls [path]`, `cd <path>` | Explore the virtual folders; `cd` returns to root |
| `cat <file>` | Print a project description, learning note, or short existing biography |
| `open <project>` | Navigate to a matching on-page project; offer its website link when available |
| `learn [topic]` | List learning topics or show one topic's current focus |
| `edit [example]` | Switch to the editor with a selected starting example |
| `theme cream`, `theme charcoal` | Change only the workspace palette |
| `play invaders` | Reveal and navigate to the existing arcade's start/resume controls |
| `clear` | Clear terminal output |

Define aliases explicitly, such as `logistics` → `afh-logistics`. Project status must come from `projects.js`; an upcoming project has no invented live link. Where a project has no dedicated page anchor, show its content and a link to the containing work area.

Unknown commands get a brief explanation and a useful suggestion. Support simple quoted arguments, relative paths, and bounded command history. Pipelines, command substitution, package installation, network requests, and arbitrary JavaScript execution are outside the first release.

Use regular React text rendering for command output. The command engine returns structured text and named actions; the page decides how to navigate or open another component. No `eval`, shell execution, or HTML injection in terminal output.

### Make something: one satisfying creative activity

Provide labeled HTML and CSS textareas, an explicit **Run preview** button, and **Reset example**. Start with three small templates:

- **Button:** change the label, color, radius, and spacing.
- **Card:** edit a heading and compose a small content card.
- **Postcard:** build a simple landscape using HTML/CSS shapes, echoing the existing Monterrey card.

Use native textareas initially. Keep the preview stationary until the visitor runs it. Display errors beside the relevant control. Reset acts only on the current example and has an undo option when replacing edits. Preserve separate drafts for each example during the page session; reloading resets them.

HTML/CSS editing is the first-release execution boundary. React, Python, SQL, AWS, and Linux are topics to explore through honest learning notes, not claimed installed runtimes.

## 4. Layout, motion, and accessibility

### Layout

- Collapsed: heading, short invitation, a small static terminal excerpt, and one launch button.
- Desktop open: terminal/editor on the left and preview or contextual guidance on the right.
- Mobile open: one column with ordinary buttons for switching views; preview follows the editor.
- Terminal lines wrap where practical; code fields can scroll internally without causing page overflow.
- Keep the section inline and let its height follow content. Do not lock the page into a viewport-sized application.
- `#sandbox` scrolls to the invitation; a URL visit does not automatically load or focus the workspace.

### Motion

Use CSS for the expansion and a restrained content fade, approximately 180–260 ms. GSAP is available if a coordinated sequence proves useful, but no new animation dependency is needed. Reduced motion removes translation and animated height transitions. No idle animation loops.

### Input and focus

- Launch uses `aria-expanded` and `aria-controls`.
- Opening moves focus to the workspace heading; the terminal input follows in normal tab order.
- Closing returns focus to the launcher. Collapsed content is unmounted and unfocusable.
- Keep Tab's normal behavior. Offer command suggestions as buttons instead of hijacking Tab completion.
- Up/Down recall history only while the terminal input is focused.
- Escape closes only when focus is within the workspace; it must not interfere with the arcade.
- Announce short command-result summaries through a polite live region; do not repeatedly announce the entire terminal history.
- Label textareas and preview, show visible focus, and make touch targets at least 44 CSS pixels.
- In the editor, preserve native keyboard editing behavior and provide visible Run/Reset controls.

## 5. Lightweight implementation

### Loading and lifecycle

Keep the invitation small and eagerly rendered. Load `SandboxWorkspace` through `React.lazy` and dynamic import only after opening. Place workspace styles and the preview sanitizer behind that boundary. Use Suspense for loading and an error boundary with a retry action for failed chunk loads. [React lazy documentation](https://react.dev/reference/react/lazy)

Before opening: no preview iframe, worker, sandbox event listeners, or sandbox-specific network requests. After closing: unmount the workspace, remove listeners, destroy the iframe, and retain only bounded draft/history state in the section owner. React StrictMode must not duplicate initialization or actions.

No additional font, bitmap asset, code-editor framework, or terminal emulator is required. A styled output region and input can support the defined commands. If a full terminal renderer becomes necessary later, remember that xterm.js supplies the terminal interface; it does not itself supply Linux or a shell. [xterm.js](https://xtermjs.org/)

### Proposed performance budgets

These are implementation targets, not measured results for the proposed feature.

| Item | Target |
| --- | --- |
| Added initial JavaScript | At most 3 KB gzip |
| Added initial CSS | At most 2 KB gzip |
| Complete deferred workspace JavaScript, including sanitizer | At most 35 KB gzip |
| Deferred workspace CSS | At most 6 KB gzip |
| Extra image/font requests | Zero |
| Idle rendering loops | Zero |
| History/output | At most 100 commands / 200 output entries, with bounded entry size |
| Command length | At most 512 characters |
| Editor source | At most 20 KB each for HTML and CSS |

Existing local build artifacts measured about **118.5 KB gzip JavaScript** and **21.7 KB gzip CSS** during planning. These are reference artifacts, not a fresh source build or deployed-site measurement. Run a new production build before implementation and compare the same bundle categories afterward. Inspect chunk imports as well as total sizes to verify the workspace really stays deferred.

### Preview containment

Render the preview in an iframe with an empty `sandbox` attribute and no script or same-origin permissions. Sandbox restrictions are documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).

Use a small, maintained HTML sanitizer such as DOMPurify, loaded with the workspace, with an explicit allowlist of presentational tags and attributes. Remove script/event attributes, forms, links that navigate, embeds, metadata, and external resource attributes. Sanitizing HTML does not sanitize the separate CSS input. [DOMPurify documentation](https://github.com/cure53/DOMPurify)

Build the iframe document with controlled serialization so text such as `</style>` cannot escape the CSS container. Apply a restrictive Content Security Policy that blocks scripts, network resources, frames, forms, and base URLs while permitting the local inline styles needed by the preview. Keep CSP metadata before visitor content. Test the generated document rather than relying on the iframe attribute alone: sandboxing does not prohibit every kind of self-navigation.

Scope the preview to simple static HTML/CSS. Templates contain no looping animation. Under reduced motion, disable preview animations/transitions and test the override against edited styles. Replacing or closing the iframe must stop any preview work. Extremely expensive CSS remains a browser performance consideration; size limits and the explicit Run action reduce accidental load, and arbitrary scripting is deferred.

## 6. File and data integration

Proposed files, with responsibilities kept small:

| New file | Responsibility |
| --- | --- |
| `src/components/sandbox/SandboxSection.jsx` | Invitation, open state, session drafts, lazy boundary |
| `src/components/sandbox/SandboxSection.css` | Small invitation/reveal styles |
| `src/components/sandbox/SandboxWorkspace.jsx` | Workspace views, terminal controls, local palette |
| `src/components/sandbox/SandboxWorkspace.css` | Deferred workspace styling |
| `src/components/sandbox/SandboxPreview.jsx` | Editor controls and contained iframe lifecycle |
| `src/lib/sandbox/commands.js` | Pure parser, path normalization, command results |
| `src/lib/sandbox/filesystem.js` | Read-only virtual files generated from shared data |
| `src/lib/sandbox/preview.js` | Sanitization and safe preview-document construction |
| `src/data/learning.js` | Existing learning card content extracted for reuse |
| `src/data/sandbox.js` | Templates, command help, aliases, short introductory copy |
| `scripts/test-sandbox.mjs` | Meaningful command/path/bounds tests |

Use `src/data/projects.js` directly for project information. Move the existing `learningTopics` content out of `LearningSection.jsx` without rewriting its meaning; both cards and terminal then read one source. Preserve **“Currently learning”**, the five topics, and their existing honest learning status. Do not add skill percentages or invented completed milestones. The older `src/data/growth.js` should not become a competing source for these cards.

All feature CSS should be scoped beneath sandbox-specific classes. Avoid global rules for `button`, `input`, `pre`, or `iframe`.

### Arcade connection

`StudioPortfolio` handles the terminal's `play invaders` action. Pass a monotonically increasing open-request value to `SpaceArcade`, which reveals its existing panel and focuses Start or Resume. Give the arcade a stable anchor for scrolling.

Opening through the sandbox does not start the game automatically or reset an existing round. Keep the arcade's current pause-on-blur/offscreen behavior. Add a small return link to the sandbox after this navigation. Arcade and terminal keyboard handlers remain local to their focused controls.

## 7. Implementation order and completion gates

| Phase | Work | Complete when |
| --- | --- | --- |
| 1. Baseline | Record fresh build sizes, page screenshots, existing interactions, and dependencies | Baseline build and `test:arcade` pass; existing failures are recorded |
| 2. Shared content | Extract learning data; define aliases and templates | Cards retain their current copy and behavior; terminal content has one source |
| 3. Section shell | Insert invitation, lazy boundary, loading/error/close states | Layout works from 320 px upward; closed section does not load workspace code |
| 4. Terminal | Implement parser, virtual files, bounded history, structured actions | Supported commands and error cases pass meaningful tests |
| 5. Editor/preview | Add templates, drafts, Run/Reset/undo, sanitizer and iframe policy | Expected examples work; malicious/navigation/network cases are blocked in browser checks |
| 6. Page connections | Wire project navigation, learning navigation, arcade reveal and return | Existing sections and game remain usable; focus moves predictably |
| 7. Polish and verification | Tune motion, touch layout, announcements, lifecycle and bundle sizes | Checks below pass and performance targets are measured |
| 8. Documentation/review | Update README and visual documentation; capture final screenshots | Local result is reviewable, limitations documented, plan checklist updated |

Phases 4 and 5 depend on the shell and agreed data shapes. Connections follow working standalone commands/editor. Do not introduce a backend, hosting migration, or full Linux runtime as an incidental part of this work.

## 8. Verification checklist

- [x] Fresh `npm.cmd run build` succeeds; compare gzip sizes and deferred chunks with baseline.
- [x] `npm.cmd run test:arcade` passes after sibling integration.
- [x] `test:sandbox` covers valid commands, unknown commands, malformed quotes, missing paths, aliases, input/history limits, and `..` staying inside the virtual root.
- [x] Virtual filenames such as `__proto__` cannot mutate object prototypes; use maps or equivalent safe lookup.
- [x] Terminal output renders markup as text and never executes it.
- [x] Preview tests exercise script/event injection, `</style>` escapes, links, forms, metadata refresh, embeds, and CSS resource URLs; verify zero unexpected network requests.
- [x] Open/close/reopen retains bounded drafts, cleans up iframe/listeners, and handles a failed lazy import.
- [x] Project URLs and statuses match canonical data; learning notes match their cards.
- [x] Arcade opens ready or paused, preserves a round, and still pauses correctly when focus leaves.
- [x] Keyboard commands/history, Escape, focus return, emulated touch controls, and reduced motion work.
- [x] Check 320, 390, 768, and 1440 px widths and command output wrapping.
- [ ] Complete a manual screen-reader and full keyboard-navigation review, large-text checks, and physical mobile keyboard testing.
- [x] Check Chromium; report Firefox, WebKit, and physical devices as untested.
- [x] Existing postcard flip/time modes, learning scenes, arcade, and `?view=original` pass their relevant browser checks.
- [ ] Final manual release review of hero, all playground controls, contact, and remaining browser/device coverage.
- [x] README explains the commands, preview limits, state reset, development checks, and this plan's relationship to Desk Mode.

Use pure Node tests for command logic and real browser checks for iframe behavior, focus, interaction, and loading. A successful production build alone does not verify those behaviors.

## 9. Future options and release boundary

The first version needs no credentials, paid service, server process, or deployment change. Deliver it as the existing static Vite build after local review. Removing the section mount and arcade bridge provides a straightforward rollback while preserving the existing portfolio.

Possible later additions should follow observed visitor use:

- More small templates or a download button for a visitor's edited example.
- An isolated JavaScript runner, with separate worker lifetime and resource-limit design.
- Actual language runtimes, each assessed independently for loading cost and usefulness.
- A real Node environment through WebContainers, or a Linux system through v86. These are different technical scopes: WebContainers provides a browser Node.js runtime; v86 emulates an x86 machine. Neither is required for the proposed interaction. [WebContainers](https://webcontainers.io/) · [v86](https://github.com/copy/v86)

**Implemented first release:** one lower-page section, an on-demand simulated terminal, three HTML/CSS examples, shared portfolio/learning data, and a link into the existing arcade. See the implementation report above for measured results and remaining browser coverage.
