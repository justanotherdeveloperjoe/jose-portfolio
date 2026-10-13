# Living footer landscape

The existing footer composition, copy, contact links and dimensions remain unchanged. MountainSignature in ProjectVisuals.jsx now adds two restrained effects to the original SVG artwork:

- Fine pointers move the ridge by at most 3px horizontally and the foothills by at most 7px. A broad SVG gradient illuminates only the ridge contours and a faint part of their fill. Pointer input works across the contact area and landscape.
- Touch/coarse-pointer devices use a smaller scroll-driven shift. Reduced-motion preferences show a still, softly lit landscape and cancel movement immediately when enabled.
- The contact invitation brightens slightly on hover or keyboard focus. Only its arrow moves; the typography and link target remain stable.

There is no autonomous animation, city-light effect, added dependency or downloaded asset. A requestAnimationFrame loop interpolates only while values are changing, then stops. Intersection and visibility checks stop and reset work outside the footer or when the page is hidden. All event listeners, observers and scheduled frames are cleaned up on unmount.

## Verification

Production build passed, with the existing v86 externalization and chunk-size warnings. scripts/check-footer.cjs passed at 1440, 768, 390 and 320px, covering preserved dimensions/neighboring content, no overflow, independent pointer depth, moving gradient, idle settling, keyboard focus, unchanged mailto destination, dynamic reduced-motion settings, offscreen reset and touch scrolling. Chromium reviewed; physical devices and other browser engines have not been tested.

Local preview: http://127.0.0.1:5173/#contact. Captures: .preview/footer-desktop-active.png and .preview/footer-mobile-active.png. Motion needs to be reviewed in the browser. Deployed to Hostinger on October 12, 2026 (release e5dbec8) and checked on the live site.

Run the check with PLAYWRIGHT_MODULE set to the installed Playwright package. PORTFOLIO_URL defaults to localhost:5173. The optional .preview/footer-baseline.json enables comparison with the page before this change.
