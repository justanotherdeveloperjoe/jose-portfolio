# Learning lab

The Currently learning section (`#learning`) keeps its five-topic notebook layout. Each topic now demonstrates a website task, alongside honest notes about what Jose is learning. No new packages, fonts, or external services are required.

## What each demo does

- **JavaScript:** editable examples for project filtering, enquiry validation, asynchronous loading, missing content, and a deliberate endless loop. `data.projects` is a fresh copy of the portfolio data supplied to each worker. Runs stop after two seconds. The worker cannot access the page DOM; it is not a network security boundary. Example enquiries and asynchronous requests are local examples and send nothing.
- **React:** a live project finder with combined name/industry search, status filters, and a saved shortlist. This is real React state, retained across topic switches until the page reloads. The component's readout shows how state changes affect the visible list.
- **SQL:** a small read-only query engine over the portfolio's eight project records and five learning topics. The project table includes Smashouse as well as the seven Workbench projects. Visitors can edit SQL, generate a search query, inspect table columns, and download the current results as CSV. Editing a query disables export until results are refreshed. JOINs are not implemented.
- **Python:** an asset-preparation study. Visitors enter filenames, choose normalization and grouping, preview proposed paths, and download a CSV mapping. Accents and spaces are normalized, extension types determine folders, and duplicate output names receive suffixes. No files are uploaded or renamed. Processing runs in JavaScript; an expandable reference shows the equivalent Python naming step, not a full interpreter.
- **AWS:** a local model of one file in S3, one CloudFront cache, and a visitor. Publish a new version, observe a previous cached version, invalidate it, and retry. An origin-outage control demonstrates cached availability and failure on a cache miss. Counters count demo requests. Expiry, real invalidation delays, and error caching are intentionally omitted. No AWS resources are connected, and the demo makes no claim that this portfolio is hosted on AWS. Reference: [CloudFront invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html).

## Files

- Topic copy: `src/data/learning.js`.
- Examples and their project snapshot: `src/data/jsExamples.js`.
- Panels: `src/components/learning/{JsLab,ReactLab,SqlLab,PythonLab,AwsLab}.jsx`.
- Shared controls and styles: `LabParts.jsx`, `LearningLab.css`, and `LearningScenes.css`.
- SQL tables: `src/data/labTables.js`; engine: `src/lib/miniSql.js`.
- Worker lifecycle: `src/lib/runJs.js` and `jsRunner.worker.js`; execution/formatting: `jsRunner.js`.
- Pure asset and delivery models, CSV escaping: `src/lib/learningTasks.js`.

## Interaction and accessibility

All panels remain mounted so edits and state survive switching topics. Arrow keys, Home, and End operate the tabs. On narrow screens the tab list scrolls horizontally; its ARIA orientation follows the layout. Inputs have labels, updates have status announcements, and buttons use native disabled/pressed semantics. Touch controls are at least 44px tall. Reduced motion disables the existing panel entrance; the new demos need no animation to communicate results.

The code editor supports Ctrl/Command + Enter to run. Tab indents; Escape then Tab leaves the editor. Download buttons create local CSV files and guard cells against spreadsheet formula interpretation.

## Verification

- `npm run test:js`: formatter, edited code, input context, all examples, validation and async failure paths.
- `npm run test:sql`: queries, errors, and existing randomized engine checks.
- `npm run test:learning`: filename collisions, Unicode, paths, empty/oversized input, CSV escaping, cache versions, outages and recovery.
- `node scripts/check-learning-lab.cjs`: interactive browser checks, downloads, keyboard tabs, preserved state, worker timeout, all five panels at 1440/1024/768/390/320px, reduced motion, and console/page errors. Uses `PORTFOLIO_URL` (default `http://127.0.0.1:5173`) and optionally `PLAYWRIGHT_MODULE`.
- `npm run build`: production Vite bundle. Existing v86 externalization and Linux desktop chunk-size warnings are unrelated to the learning labs.

Chromium checks do not replace physical-device or Safari/Firefox testing. After publishing, verify the served entry page against `dist/index.html` and run the browser checks against the live address.
