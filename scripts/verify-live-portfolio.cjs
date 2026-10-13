// Verify a published build, including the served entry page and real interactions.
// Requires an existing Playwright installation, not a site dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const base = process.env.PORTFOLIO_URL || 'https://hechoporjs.com';
const hash = data => createHash('sha256').update(data).digest('hex');

(async () => {
  const results = { checkedAt: new Date().toISOString(), base, urls: [], browserErrors: [] };
  const expected = hash(fs.readFileSync('dist/index.html'));
  for (const url of [base, base.replace('://', '://www.')]) {
    const reply = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const html = Buffer.from(await reply.arrayBuffer());
    assert.equal(reply.status, 200, url);
    assert.ok(reply.url.startsWith('https://'), 'Visitors reach HTTPS');
    assert.equal(hash(html), expected, 'Public entry page matches this build');
    results.urls.push({ requested: url, final: reply.url, status: reply.status });
  }
  results.entrySha256 = expected;
  const weather = await fetch(`${base}/api/weather.php`);
  assert.equal(weather.status, 200);
  assert.ok((await weather.json()).properties.timeseries.length > 0);
  results.weather = 'Live forecast JSON returned';
  for (const [path, marker] of [['/robots.txt', `${base}/sitemap.xml`], ['/sitemap.xml', `${base}/`], ['/sprites/digimon/credits.txt', 'RadSpyro']]) {
    const reply = await fetch(base + path); assert.equal(reply.status, 200); assert.ok((await reply.text()).includes(marker));
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => results.browserErrors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.title(), 'Jose Sanchez — Front-End Developer');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${base}/`);
    assert.equal(await page.locator('.workbench-card').count(), 7);
    const card = page.locator('.digimon-card'); await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'Feed', exact: true }).click();
    assert.match(await card.getByRole('status').textContent(), /Snack/);
    const food = await card.locator('meter').first().getAttribute('value'); assert.ok(Number(food) > 95);
    await card.getByRole('button', { name: /A note from Jose/ }).click();
    assert.equal(await card.locator('.digimon-front').getAttribute('inert'), '');
    await page.waitForTimeout(750);
    fs.mkdirSync('.preview', { recursive: true });
    await card.screenshot({ path: '.preview/hechoporjs-live-note.png' });
    await card.getByRole('button', { name: /Back to Agumon/ }).click();
    await page.reload({ waitUntil: 'networkidle' }); await card.scrollIntoViewIfNeeded();
    assert.ok(Number(await card.locator('meter').first().getAttribute('value')) > 95, 'Care persisted on the new domain');
    assert.equal(await card.locator('.is-unavailable').count(), 0);
    await page.locator('#about').screenshot({ path: '.preview/hechoporjs-live-desktop.png', style: '.studio-skip:not(:focus){visibility:hidden}' });
    await page.locator('#learning').scrollIntoViewIfNeeded();
    const js = page.locator('#learning-panel-javascript');
    await js.locator('textarea').fill('console.log("Hello from hechoporjs.com", 2 + 3)');
    await js.locator('.lab-run').click();
    await page.waitForFunction(() => document.querySelector('#learning-panel-javascript .lab-line.is-log')?.textContent.includes('hechoporjs.com 5'));
    await page.locator('#learning-tab-data').click();
    await page.locator('#learning-panel-data .lab-run').click();
    assert.equal(await page.locator('#learning-panel-data .lab-table tbody tr').count(), 6);
    await page.setViewportSize({ width: 390, height: 844 }); await card.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await card.screenshot({ path: '.preview/hechoporjs-live-mobile.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await card.locator('.digimon-flipper').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    assert.deepEqual(results.browserErrors, []);
    results.interactions = 'Pet care, flip, reload persistence, JavaScript worker, SQL, mobile and reduced motion passed';
    fs.writeFileSync('.preview/hechoporjs-live-verification.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
