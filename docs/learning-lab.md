# Learning lab

The "Currently learning" section (`#learning`) is a lab notebook. Down the side are the five topics (JavaScript, React, SQL, Python, AWS). Beside them is the chosen topic, open: its experiment, plus a few notes on what I'm learning and what I'm working toward. It used to be five tall cards. The section is now about one screen on desktop (1,006px, was 2,236px) and 1,677px on a phone (was 4,752px).

## What's real

- **JavaScript runs for real.** Visitors edit the code and press Run (or Ctrl/⌘ + Enter) and see the actual output.
  - The code runs in a fresh Web Worker for every run (`src/lib/runJs.js`), separate from the page: it can't reach the DOM, the site or anything else on the page.
  - The worker is stopped after 2 seconds whatever it's doing, so an endless loop never freezes anything. One of the starter examples is a deliberate endless loop, to show it.
  - Output reads like a console (`src/lib/jsRunner.js`). `await` works at the top level, `return x` shows x, errors are explained, and long output is trimmed.
  - Starter snippets live in `src/data/jsExamples.js`.
- **SQL runs real queries on real data.** A small engine I wrote (`src/lib/miniSql.js`) runs SELECT queries over two tables built from the site's own data (`src/data/labTables.js`):
  - `projects`, the 8 Workbench projects;
  - `skills`, the 5 topics.
  - It supports `WHERE` (`=`, `!=`, `<`, `>`, `LIKE`, `IN`, `IS NULL`, `AND`/`OR`/`NOT`), `GROUP BY` with `COUNT`, `ORDER BY`, `LIMIT` and `DISTINCT`, and follows SQLite's rules: `=` is case-sensitive, `LIKE` isn't, and NULL never matches.
  - Anything it can't do, including any attempt to change data, gets a friendly explanation instead of a crash.
- **The editor** (`learning/CodeEditor.jsx`) is a real text box with syntax colors drawn exactly underneath it (`src/lib/highlight.js`). Tab indents; Esc then Tab moves on.

React, Python and AWS keep their illustrated scenes for now (`LearningScenes.jsx`); upgrading them is the second pass.

## How it behaves

- **Tabs:** the topics are proper tabs. Arrow keys, Home and End move between them and focus follows.
- **Edits survive switching:** every panel stays mounted (only one shows), so code edited in one lab is still there after a look at another.
- **Narrow screens:** the topics become a row that scrolls sideways, and a tapped topic slides fully into view.
- **Reduced motion:** turns off the panel's fade-in.

## Checks

- **`npm run test:sql`**
  - The real answers about the projects.
  - SQLite-style rules and the friendly errors.
  - 5,000 random token soups and 3,000 generated queries: every input either answers or explains itself.
- **`npm run test:js`**
  - Console-style formatting, `await`, return values and explained errors.
  - Every starter snippet's exact output.
- **`scripts/check-learning-lab.cjs`** (dev server or `npm run preview`; `PORTFOLIO_URL` defaults to `http://127.0.0.1:5173`)
  - Section height on desktop and phone, and keyboard tabs.
  - JavaScript:
    - real output from edited code, Ctrl+Enter, and errors;
    - the editor's two layers lining up exactly, and edits kept across tabs;
    - the endless loop stopped in about 2 seconds while the page keeps responding.
  - Real SQL answers and errors, and the three illustrated scenes.
  - Phone layout, reduced motion, and no console errors.
  - Also passes against the production build, where the worker is its own small file.

Built on the `learning-lab` branch, in its own worktree (`../jose-portfolio-lab`). Chromium verified; other browsers and physical devices have not been tested. Not deployed.
