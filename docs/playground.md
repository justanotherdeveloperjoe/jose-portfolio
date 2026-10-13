# Playground: Monterrey, live

The Playground is one editorial poster, "Made in Monterrey.", that is a live portrait of the city. The print comes first, mounted in a light frame. Beneath it are the four tabs (Motion, Layout, Type, Color) and Reset, then the controls for the chosen tab (the time slider carries a 00:00–24:00 scale), then "About this living print". That disclosure folds the story away, but the data credits beside it stay visible. The arcade follows. Everything it uses is free, and it adds no dependencies.

## What is real

- **Skyline.** The ridges are Monterrey's actual skyline seen from 25.6866° N, 100.3161° W (the coordinates printed on the poster): Cerro de la Silla's saddle, the Sierra Madre and Cerro de las Mitras, with Loma Larga in front. `scripts/build-skyline.mjs` downloads two 1° elevation tiles from AWS Terrain Tiles (cached in `.cache/terrain`, ignored by git), casts a sightline every 0.25° from 60° to 300° azimuth, allows for Earth's curvature and refraction, and writes the highest angle in three distance bands (0.4–3.5 km, 3.5–14 km, 14–60 km) to `src/data/skyline.js`. Run it again with `npm run build:skyline`; the site only ships the result (about 15 kB).
- **Sun and moon.** `src/lib/sky.js` computes their positions in the browser (formulas after SunCalc, BSD-2-Clause, with the main lunar terms from Meeus and the moon's parallax). The moon is drawn at its real phase, with its bright side facing the sun. The sky turns from day to night through civil twilight, and the stars come out after it.
- **Weather.** MET Norway's free forecast for the same point, through `public/api/weather.php`. Clouds follow the forecast cloud cover and drift with the real wind as seen across this line of sight. Rain, fog and thunderstorms each have their own look. The readout shows the temperature and conditions.

## Interactions

- **Motion:** drag the sun and it stays under the pointer along its real path for that day. Dragging anywhere else moves twelve hours per poster width, and horizontal drags work on touch screens. The Time of day slider moves in 15-minute steps with the arrow keys (an hour with Shift). Play a day runs 24 hours in nine seconds, the forecast included, then returns to live. The Live button returns at any time. The words and ridges arrive once, when the poster first scrolls into view.
- **Layout:** narrowing the poster crops the panorama around the Silla instead of squeezing it.
- **Type:** the weight and spacing sliders as before. "Made in" also swells toward weight 800 under the cursor, letter by letter.
- **Color:** each palette pairs a day print with a night print. A new palette spreads into the print from the button that chose it, and each block of type changes color as the ink front reaches it.
- **Reset** restores every setting and returns to live.
- **Reduced motion:** with reduced motion on, nothing plays on arrival, Play a day is off, the stars don't twinkle, the weather holds still and palettes switch at once. Dragging and the slider still work.

## How it is drawn

`src/lib/monterreyScene.js` turns a moment, the poster's size and a palette into a scene: projection, ridges, sky colors, sun, moon, stars, weather and readout. `src/components/MonterreySky.jsx` draws that scene with `src/lib/printShader.js`, a hand-written WebGL2 fragment shader that renders the whole landscape as a risograph print. It adds paper grain and ink mottling, halftone dots for twilight glow and cloud edges, and inks printed slightly out of register. If WebGL2 is unavailable or the context is lost, the same scene is drawn as SVG. The shader only keeps animating while the poster is on screen and something moves: stars twinkling, weather drifting, or a palette spreading.

## Weather relay

`public/api/weather.php` fetches MET Norway's Locationforecast for the poster's coordinates, so visitors' browsers only ever talk to this site. It follows MET Norway's terms:

- It identifies the site in the User-Agent.
- It waits until the `Expires` time and never asks more than once every ten minutes.
- It asks again with `If-Modified-Since`.
- It keeps serving the last forecast if MET Norway is unreachable.

Credit ("Weather data from MET Norway") appears in the line below the controls. When the site moves to its own domain, update `AGENT` in the PHP file and in `scripts/weather-dev.mjs`. That script is the same relay inside Vite for local development, because Vite cannot run PHP. In development, `?weather=clear|partlycloudy|cloudy|rain|storm|fog` previews a condition without the network.

The PHP relay has not run on Hostinger yet. Check `/api/weather.php` after the next deploy.

## Credits

- Elevation: INEGI, Continental relief 2016, and USGS SRTM, via AWS Terrain Tiles.
- Weather: MET Norway, CC BY 4.0.
- Astronomy: after SunCalc by Vladimir Agafonkin (BSD-2-Clause) and Meeus, *Astronomical Algorithms*.

## Checks

- `npm run test:sky` covers:
  - Equinox noon altitude, solstice sunrise azimuth and time.
  - The 2026 lunar and solar eclipses, moon phases and Monterrey's UTC−6 day.
  - Sunrise and sunset, and finding the sun at an azimuth.
  - The projection, the Silla's saddle in the skyline data, and forecast parsing and easing.
- `scripts/check-playground.cjs` uses the dev server, a fixed afternoon clock and Playwright via `PLAYWRIGHT_MODULE` (`PORTFOLIO_URL` defaults to `http://127.0.0.1:5173`). It covers:
  - The print shader, the readout and the label.
  - No overflow and the text bounds at 1440, 768, 390 and 320px, with the Workbench, Services, About and Learning sections unchanged against `.preview/playground-baseline.json`.
  - Keyboard tabs, the layout, type and color controls, time steps, Live and Reset.
  - Play a day, the reactive letters and reduced motion.
  - The SVG fallback with sun dragging, the rain preview, and touch palette selection.

Chromium was verified. Firefox, Safari and physical devices have not been tested. The changes are local and not deployed.
