// Asset preparation only; Playwright is not a site dependency. Source PNGs are
// the audited World DS sheets in .preview/research-<stage>.png (see credits).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const strips = (x, y, step, w, h, count) => Array.from({ length: count }, (_, i) => [x + i * step, y, w, h]);
const sources = {
  agumon: strips(13, 75, 33, 32, 32, 9),
  greymon: [4, 41, 78, 120, 157, 194, 236, 273, 310].map(x => [x, 302, 32, 64]),
  metalgreymon: [[290, 168, 43, 42], [290, 208, 43, 42], [290, 249, 43, 42], [128, 316, 48, 44], [128, 360, 48, 48]],
  wargreymon: strips(4, 434, 34, 32, 66, 9),
};
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    fs.mkdirSync('public/sprites/digimon', { recursive: true });
    for (const [name, rectangles] of Object.entries(sources)) {
      const source = fs.readFileSync(`.preview/research-${name}.png`).toString('base64');
      const result = await page.evaluate(async ({ source, rectangles, name }) => {
        const image = new Image(); image.src = `data:image/png;base64,${source}`; await image.decode();
        const sheet = document.createElement('canvas'); sheet.width = image.width; sheet.height = image.height;
        const ctx = sheet.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
        const frames = rectangles.map(([x, y, w, h]) => {
          const pixels = ctx.getImageData(x, y, w, h), counts = new Map();
          for (let i = 0; i < pixels.data.length; i += 4) {
            if (pixels.data[i + 3]) { const key = Array.from(pixels.data.slice(i, i + 3)).join(','); counts.set(key, (counts.get(key) || 0) + 1); }
          }
          const cornerOpaque = pixels.data[3] === 255;
          const key = cornerOpaque ? [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] : null;
          let left = w, top = h, right = 0, bottom = 0;
          for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
            const i = (row * w + col) * 4;
            const color = Array.from(pixels.data.slice(i, i + 3)).join(',');
            if (color === key || color === '0,128,128' || color === '80,176,88') pixels.data[i + 3] = 0;
            if (pixels.data[i + 3]) { left = Math.min(left, col); right = Math.max(right, col); top = Math.min(top, row); bottom = Math.max(bottom, row); }
          }
          return { pixels, left, right, top, bottom, w, h };
        });
        // Shared strip anchors preserve the drawn bob. MetalGreymon's frames
        // come from separate source groups, so align each of those to the floor.
        const top = Math.min(...frames.map(f => f.top)), bottom = Math.max(...frames.map(f => f.bottom));
        const out = document.createElement('canvas'); out.width = 56 * frames.length; out.height = 56;
        const target = out.getContext('2d');
        frames.forEach((f, i) => {
          const cell = document.createElement('canvas'); cell.width = f.w; cell.height = f.h;
          cell.getContext('2d').putImageData(f.pixels, 0, 0);
          const ground = name === 'metalgreymon' ? f.bottom : bottom;
          const height = ground - top + 1;
          if (height > 54 || f.right < f.left) throw new Error(`Invalid frame bounds: ${name} ${i}`);
          target.drawImage(cell, 0, top, f.w, height, i * 56 + Math.floor((56 - f.w) / 2), 54 - height, f.w, height);
        });
        return { png: out.toDataURL().split(',')[1], bounds: frames.map(({ left, right, top, bottom }) => ({ left, right, top, bottom })) };
      }, { source, rectangles, name });
      fs.writeFileSync(`public/sprites/digimon/${name}.png`, Buffer.from(result.png, 'base64'));
      console.log(name, result.bounds);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
