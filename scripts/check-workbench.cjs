const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173';

const order = ['p08', 'p06', 'p07', 'p02', 'p05', 'p01', 'p03'];
const live = {
  p08: 'https://www.ikinukitripagency.com/',
  p06: 'https://propiedadesallende.com',
  p07: 'https://afh.mx',
  p02: 'https://tkindustrial.org/',
  p05: 'https://elsotanocomico.com/',
};

(async () => {
  fs.mkdirSync('.preview', { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    const section = page.locator('#work');
    const cards = section.locator('.workbench-card');

    // One gallery: seven cards, no leftover standalone showcases.
    assert.equal(await cards.count(), 7);
    assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(el => el.id)), order);
    assert.equal(await page.locator('.studio-work-pair, .studio-estate, .studio-logistics, .studio-comedy, .after-hours').count(), 0);
    assert.equal(await page.locator('#transformation, [id$="-under-the-hood"]').count(), 0, 'AFH panels open only on request');
    assert.equal(await section.evaluate(el => el.nextElementSibling.id), 'playground');
    assert.equal(await section.locator('h2').count(), 1);
    assert.equal(await section.locator('.studio-kicker').first().innerText(), '01 / SELECTED WORK');
    assert.equal(await page.locator('.studio-nav a[href="#work"] span').innerText(), '07');
    assert.deepEqual(await cards.locator('.workbench-number').allInnerTexts(), ['01', '02', '03', '04', '05', '06', '07']);
    assert.match(await section.locator('.workbench-legend').innerText(), /05 LIVE\s+02 IN PROGRESS/);
    for (const href of await page.locator('a[href^="#"]').evaluateAll(nodes => nodes.map(el => el.getAttribute('href')))) {
      if (href.length > 1) assert.equal(await page.locator(`[id="${href.slice(1)}"]`).count(), 1, `Broken or duplicate anchor ${href}`);
    }

    // Accurate status and calls to action.
    for (const id of order) {
      const card = page.locator(`#${id}`), url = live[id];
      const links = card.locator('.workbench-card-foot a');
      if (url) {
        assert.equal(await links.count(), 1, `${id} needs a Visit website link`);
        assert.equal(await links.getAttribute('href'), url);
        assert.equal(await links.getAttribute('target'), '_blank');
        assert.equal((await links.innerText()).replace(/\s+/g, ' '), 'Visit website ↗');
        assert.match(await card.locator('.workbench-status').innerText(), /^Live/);
        assert.equal(await card.locator('.workbench-closed-label').innerText(), 'Project details');
      } else {
        assert.equal(await links.count(), 0, `${id} is not live and must not link out`);
        assert.equal(await card.locator('.workbench-status').innerText(), 'Client study · In progress');
        assert.equal(await card.locator('.workbench-closed-label').innerText(), 'Explore study');
      }
    }
    assert.equal(await page.locator('#p05 .workbench-status').innerText(), 'Live · Independent project');
    assert.equal(await page.locator('#p08 .workbench-card-meta > span:first-child').innerText(), 'Luxury Travel / Tourism');

    // Services stay unchanged; the Playground now has its own interaction checks.
    const baseline = fs.existsSync('.preview/after-hours-baseline.json') ? JSON.parse(fs.readFileSync('.preview/after-hours-baseline.json', 'utf8')) : null;
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => document.fonts.ready);
      if (baseline?.[width]) {
        const current = await page.evaluate(() => Object.fromEntries(['#services'].map(selector => {
          const root = document.querySelector(selector);
          return [selector, { html: root.outerHTML, layout: [root, ...root.querySelectorAll('h2,h3,p,img,button,a')].map(el => {
            const r = el.getBoundingClientRect(), s = getComputedStyle(el);
            return [el.tagName, r.width, r.height, s.fontFamily, s.fontSize, s.color, s.backgroundColor];
          }) }];
        })));
        for (const selector of Object.keys(current)) {
          assert.equal(current[selector].html.replace(/ style=""/g, ''), baseline[width][selector].html.replace(/ style=""/g, ''), `${selector} content changed at ${width}`);
          const actual = current[selector].layout, expected = baseline[width][selector].layout;
          assert.equal(actual.length, expected.length);
          for (let i = 0; i < actual.length; i++) for (let j = 0; j < actual[i].length; j++) {
            if (typeof actual[i][j] === 'number') assert.ok(Math.abs(actual[i][j] - expected[i][j]) < .1, `${selector} dimensions changed at ${width}: ${i}/${j}`);
            else assert.equal(actual[i][j], expected[i][j], `${selector} style changed at ${width}`);
          }
        }
      }
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement?.blur());
      await page.evaluate(() => Promise.all([...document.querySelectorAll('#work img')].map(img => img.decode())));
      assert.ok(await page.evaluate(() => [...document.querySelectorAll('#work img')].every(img => img.naturalWidth > 0)), `Image failed at ${width}`);

      // Complete rows: the heading fills the first cells, so no card is left alone on a row.
      const layout = await cards.evaluateAll(nodes => nodes.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
      const intro = await section.locator('.workbench-intro').evaluate(el => { const r = el.getBoundingClientRect(); return { y: r.y, width: r.width, height: r.height }; });
      const rows = [...new Set(layout.map(box => Math.round(box.y)))].map(y => layout.filter(box => Math.abs(box.y - y) < 1).length);
      const columns = width > 1100 ? 3 : width > 540 ? 2 : 1;
      assert.equal(Math.max(...rows), columns, `Expected ${columns} columns at ${width}`);
      if (columns > 1) {
        assert.deepEqual(rows, [1, ...Array(rows.length - 1).fill(columns)], `Incomplete row at ${width}: ${rows}`);
        assert.ok(Math.abs(intro.y - layout[0].y) < 1 && Math.abs(intro.height - layout[0].height) < 1, `Heading cell misaligned at ${width}`);
        const gap = layout[2].x - layout[1].x - layout[1].width;
        assert.ok(Math.abs(intro.width - (layout[0].width * (columns - 1) + gap * (columns - 2))) < 1, `Heading should span ${columns - 1} column(s) at ${width}`);
      }
      for (const box of layout) { assert.ok(Math.abs(box.width - layout[0].width) < 1); assert.ok(Math.abs(box.height - layout[0].height) < 1, `Unequal card height at ${width}`); }
      assert.ok(layout[0].width >= 260, `Cards too narrow at ${width}: ${layout[0].width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Page overflow at ${width}`);
      const spacing = await page.evaluate(() => { const work = document.querySelector('#work').getBoundingClientRect(); const playground = document.querySelector('#playground'); return { gap: playground.getBoundingClientRect().top - work.bottom, margin: parseFloat(getComputedStyle(playground).marginTop) }; });
      assert.ok(Math.abs(spacing.gap - spacing.margin) < 1, `Unexpected gap before Playground at ${width}`);
      assert.equal(await section.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'Workbench must not animate at rest');

      await section.screenshot({ path: `.preview/workbench-${width}.png` });
      await page.locator('#playground').evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 250, behavior: 'instant' }));
      await page.screenshot({ path: `.preview/workbench-transition-${width}.png` });
      for (let i = 0; i < 7; i++) {
        const card = cards.nth(i), details = card.locator('details');
        await card.locator('summary').focus(); await page.keyboard.press('Enter');
        assert.equal(await details.evaluate(el => el.open), true);
        assert.ok(await card.locator('.workbench-details').isVisible());
        await page.keyboard.press('Space');
        assert.equal(await details.evaluate(el => el.open), false);
      }
      console.log(`${width}px: ${columns} columns, rows ${rows.join('/')}, equal cards, no overflow or gap; keyboard expand/collapse passed.`);
    }

    // AFH keeps its design notes and wireframe comparison, behind its card.
    await page.setViewportSize({ width: 1440, height: 1000 });
    const afh = page.locator('#p07');
    await afh.locator('summary').click();
    const notesButton = afh.getByRole('button', { name: /Design notes/ });
    await notesButton.click();
    await page.locator('#p07-under-the-hood').waitFor();
    assert.equal(await page.locator('#p07-notes-title').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#p07-under-the-hood').count(), 0);
    assert.equal(await notesButton.evaluate(el => el === document.activeElement), true);
    const compareButton = afh.getByRole('button', { name: /Wireframe comparison/ });
    await compareButton.click();
    await page.locator('#transformation').waitFor();
    assert.equal(await compareButton.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#transformation-title').evaluate(el => el === document.activeElement), true);
    await page.locator('#transformation .transformation-presets button', { hasText: 'Finished' }).click();
    await page.getByRole('button', { name: /Close comparison/ }).click();
    assert.equal(await page.locator('#transformation').count(), 0);
    assert.equal(await compareButton.evaluate(el => el === document.activeElement), true);
    await afh.locator('summary').click();

    // Live link works by touch on a phone.
    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await touch.route('https://www.ikinukitripagency.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Project link check</title>' }));
    await touch.goto(base, { waitUntil: 'networkidle' });
    const popupPromise = touch.waitForEvent('popup');
    await touch.locator('#p08 .workbench-visit').tap();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(), 'https://www.ikinukitripagency.com/');
    await popup.close();
    await touch.locator('#p07 summary').tap();
    await touch.locator('#p07').screenshot({ path: '.preview/workbench-mobile-expanded.png' });
    await touch.close();
    assert.deepEqual(errors, []);
    console.log('Workbench: seven-card grid, statuses and links, AFH notes/comparison, unchanged services, anchors, keyboard, touch and console checks PASS.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
