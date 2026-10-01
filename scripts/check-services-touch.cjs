const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 850 }, hasTouch: true, isMobile: true });
    await page.goto(process.env.SERVICES_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'View case study' }).tap();
    await page.locator('#service-case-study').waitFor({ state: 'visible' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.getByRole('button', { name: 'Close case study' }).tap();
    await page.locator('#service-case-study').waitFor({ state: 'hidden' });
    const title = page.getByLabel('Make it yours', { exact: true });
    await title.fill('WWWWWWWWWWWWWWWWWWWWWW');
    assert.ok(await page.locator('.service-demo-poster').evaluate(node => node.scrollHeight <= node.clientHeight), 'Long title stays in the poster');
    await page.getByRole('button', { name: 'Try it on merch' }).tap();
    await page.getByRole('img', { name: /T-shirt design: WWWW/ }).waitFor();
    const sticker = page.getByRole('button', { name: /Move the sticker/ });
    await sticker.scrollIntoViewIfNeeded();
    const bounds = await sticker.boundingBox();
    const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 45, y: y + 30 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.ok(parseFloat(await sticker.evaluate(node => node.style.getPropertyValue('--sticker-x'))) < -5);
    console.log('320px touch: tabs, sticker drag, long headline, case-study layout and close: PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
