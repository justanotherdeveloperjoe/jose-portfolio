# Workbench

Selected work (`#work`) is a single gallery of seven equal cards: Ikinuki Trip Agency, Propiedades Allende, AFH Logistics, TK Industrial, El Sótano Cómico, Nutrióloga Allende and Wolf Fitness. The former oversized Real Estate and Logistics showcases, their always-visible AFH notes and the before/after comparison were removed from the page flow. The section heading (`01 / Selected work`) is the first grid cell, and the navigation count reads `07`.

## Layout

- Three columns above 1100px, two from 541px to 1100px, one at 540px and below.
- The heading spans two cells at three columns and one cell at two columns. That leaves no orphan card at any width: rows are 1/3/3 on desktop and 1/2/2/2 on tablet.
- Card artwork height follows the card width (`clamp(255px, 75cqi, 320px)`), so cards stay equal in each row and previews keep a readable ratio.
- Card order alternates light and dark artwork in every column count. Change it in `workbenchProjects` in `src/components/StudioPortfolio.jsx`.

## Cards

Each card keeps the existing structure: the artwork, number and name, the category and a disclosure. The whole face opens the details, as before. A footer row states the project's status:

- Live projects (Ikinuki, Propiedades Allende, AFH, TK Industrial, El Sótano) show `● Live website` and a `Visit website ↗` link that opens a new tab. Their disclosure reads `Project details`.
- Client studies (Nutrióloga Allende, Wolf Fitness) show `○ Client study · In progress`, with no external link. Their disclosure reads `Explore study`.
- El Sótano is labeled `Live · Independent project`. Its category is again `Media & Entertainment`, matching the industry categories on the other cards.

The heading copy and legend (`05 Live / 02 In progress`, computed from the data) describe the mix of live websites, independent work and studies.

Expanding AFH Logistics shows `Design notes` and `Wireframe comparison`. Each opens its existing panel below the grid, moves focus to the panel heading and closes with its button or Escape, returning focus to the trigger. Only one panel is open at a time.

## Artwork sources

Every image is a real project asset; see [visual assets](visual-assets.md).

- Propiedades Allende: the Quinta El Roble photograph with the site screenshot in a browser frame, using the original cream, serif-italic composition.
- AFH Logistics: the navy and lime composition, route diagram, and desktop and mobile captures.
- Ikinuki Trip Agency: a CSS crop of `public/screenshots/ikinuki.jpg`, an unmodified capture of the live homepage (October 6, 2026). The crop keeps the site's own photography, Playfair Display headline and gold call to action. Labels use its gold (`#c5a059`) and wide letter-spacing. No developer credit is stated on the live site, so the card claims none; its features (Spanish/English switch, curated experiences, email and phone contact) were checked on the live site.
- El Sótano Cómico: the original welcome illustration, cropped from `public/screenshots/elsotanocomico-welcome.jpg`.
- TK Industrial: unchanged typographic artwork. Now that it links to [tkindustrial.org](https://tkindustrial.org/), its details match that site (checked October 6, 2026): plain HTML/JS rather than React/Vite, and processes, capability stats, a gallery, a quote form and WhatsApp rather than a catalog.
- Nutrióloga Allende and Wolf Fitness: unchanged typographic artwork.

Hover movement is limited to the existing small lifts. Nothing animates at rest.

## Verification

`scripts/check-workbench.cjs` checks card order and numbering, statuses, labels and link targets. It confirms the old showcases are gone and the panels start closed. At 1440, 1024, 768, 390 and 320px it checks complete rows, the heading span, equal card sizes, loaded images, no horizontal overflow and the spacing before Playground. It also covers keyboard expand/collapse for every card, the AFH panel focus cycle, tapping a live link on a phone (stubbed) and console errors. Playground and services are compared with `.preview/after-hours-baseline.json`, a capture made before these changes, and still match.

```powershell
$env:PLAYWRIGHT_MODULE = '<path to an installed playwright package>'
node scripts/check-workbench.cjs   # PORTFOLIO_URL defaults to http://127.0.0.1:5173
```

`scripts/check-services.cjs` was updated for seven cards and a six-card hero deck; Ikinuki and TK Industrial join the deck automatically as live projects. Chromium only; Firefox, Safari and physical devices are unverified. Changes are local and have not been deployed.
