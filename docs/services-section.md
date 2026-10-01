# Work With Me section

Implemented locally on October 1, 2026. The user confirmed USD for the starting prices. Placement: after the sandbox and before contact, with a Services link in the main navigation.

## Service progression

| Service | Price | Real example | Interaction |
| --- | --- | --- | --- |
| Launch | From $300 USD | Smashouse | 6 px hover lift, brighter border, slight image zoom, and moving CTA arrow |
| Business Website | From $650 USD | AFH Logistics | Independent device parallax, a working Desktop / Mobile switch, and features that stagger into view |
| Custom Build | Custom quote | El Sótano Cómico | An editable poster / merch demo, color controls, draggable sticker, cursor spotlight, and an expandable case study |

Examples illustrate the scope of each service; the section does not claim those projects were sold at the displayed starting prices. Final scope and price are agreed before work begins. Each service's CTA opens a prefilled email draft with its name and prompts for the business, website goal, and timing.

## Files

- `src/data/services.js`: service names, prices, descriptions, deliverables, project slugs, and email drafts.
- `src/components/ServicesSection.jsx`: cards, project previews, pointer handling, device selection, viewport entry, and the inline case study.
- `src/components/ServiceCustomDemo.jsx`: live poster and T-shirt previews, editable headline, ink selection, draggable sticker, and reset.
- `src/components/ServicesSection.css`: scoped layout, progressive interaction, responsive styles, reduced motion, and the fourth hero deck position.
- `src/data/projects.js`: Smashouse is now live at the supplied HTTP URL, with `/screenshots/smashouse.jpg` captured from the real site.
- `src/components/StudioPortfolio.jsx`: section placement, navigation, and explicit featured-project selection to preserve the existing three featured layouts when another project goes live.
- `src/components/Workbench.jsx` and `src/studio.css`: the remaining three upcoming projects fit the grid without a stale four-project count.

The section reuses the portfolio's dark colors, display and serif type, borders, and spacing. It adds no libraries, iframe embeds, background loops, or runtime requests to example sites. Images load from the portfolio; opening an example follows a deliberate external link. All essential content is visible without hovering. The custom controls work with keyboard and touch. The sticker also moves with arrow keys; Home resets its position. The demo is a portfolio experiment inspired by El Sótano, as explained in the case study. It is not a client production feature. The case study supports Escape to close and restores focus to its link. Cursor motion is limited to fine pointers and disabled for reduced motion, while controls remain functional.

## Verification

Production build, existing sandbox data tests, and `scripts/check-services.cjs` passed. The Chromium check covers prices and USD labels, destinations, email draft content, loaded thumbnails, project IDs, the four-project deck, three remaining workbench projects, device switching, live headline and color changes, pointer and keyboard sticker movement, demo reset, case-study focus/close behavior, cursor reset, reduced motion, and layouts at 320, 390, 768, 1024, and 1440 px. The original route remains separate. `scripts/check-services-touch.cjs` checks the 320 px layout with emulated touch: case-study open/close, format selection, sticker dragging, and a maximum-length headline. Case-study taps are tested before synthetic dragging because Chromium suppressed the first subsequent compatibility click when both were sequenced the other way around; physical-device behavior is unverified. Firefox, Safari, and physical devices have not been checked for this addition.

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
# In another terminal, with Playwright available:
node scripts/check-services.cjs
node scripts/check-services-touch.cjs
```

Use `PLAYWRIGHT_MODULE` to point to an existing Playwright installation and `SERVICES_URL` to change the preview URL.

Smashouse returned HTTP 200 at `http://smashouseburger.com/`. HTTPS reported `ERR_CERT_COMMON_NAME_INVALID`. The supplied HTTP link is retained; this work does not change that site's hosting or certificate.

This services addition is local and has not been deployed.
