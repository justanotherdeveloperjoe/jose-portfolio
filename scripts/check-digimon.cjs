// Browser regression checks. Use a running Vite server and a local Playwright install.
// PLAYWRIGHT_MODULE can point to an existing installation; no runtime dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const url = process.env.PET_TEST_URL || 'http://127.0.0.1:5173';
const key = 'jose-portfolio:digimon:v1';
const shotOptions = { style: '.studio-skip:not(:focus){visibility:hidden}' };

(async () => {
  const { createPet } = await import(pathToFileURL(path.resolve('src/lib/digimon/engine.js')));
  const browser = await chromium.launch();
  const errors = [];
  fs.mkdirSync('.preview', { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.addInitScript(key => {
      const seeded = sessionStorage.getItem('pet-test-seed');
      if (seeded !== null) { localStorage.setItem(key, seeded); sessionStorage.removeItem('pet-test-seed'); }
    }, key);
    page.on('pageerror', error => errors.push(error.message));
    const card = page.locator('.digimon-card');
    const control = name => card.getByRole('button', { name, exact: true });
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const enter = async () => { await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); };
    const seed = async data => { await page.evaluate(data => sessionStorage.setItem('pet-test-seed', JSON.stringify(data)), data); await page.reload(); await enter(); };
    const still = () => card.locator('.digimon-sprite').getAttribute('style');
    await page.goto(url, { waitUntil: 'networkidle' }); await enter();
    await control('Feed').click();
    assert.match(await card.getByRole('status').textContent(), /Snack/);
    assert.ok((await saved()).food > 98);
    assert.equal(await control('Train').isDisabled(), true, 'Competing actions must be locked');
    await page.waitForTimeout(2200); await control('Train').click();
    const trained = await saved(); assert.equal(trained.training, 8);
    await page.reload(); await enter();
    assert.equal((await saved()).training, 8, 'Training persists on reload');
    await page.waitForTimeout(3000); await control('Rest').click();
    await page.waitForTimeout(1200); await control('Wake').click();
    assert.ok((await saved()).energy > trained.energy, 'Rest restores energy');
    const second = await context.newPage(); await second.goto(url); await second.locator('.digimon-card').scrollIntoViewIfNeeded();
    await second.locator('.digimon-controls').getByRole('button', { name: 'Pet', exact: true }).click();
    await page.waitForTimeout(350);
    assert.match(await card.getByRole('status').textContent(), /other tab/);
    const revision = (await saved()).revision; await page.waitForTimeout(500);
    assert.equal((await saved()).revision, revision, 'Storage sync must settle without a write loop');
    await second.close();
    console.log('Persistence browser checks passed: reload, rest and multi-tab synchronization.');

    const fresh = createPet(Date.now()); await seed(fresh);
    const dimensions = {};
    for (const [width, label] of [[1440, 'desktop'], [1024, 'laptop'], [768, 'tablet'], [390, 'mobile'], [320, 'narrow']]) {
      await page.setViewportSize({ width, height: 1000 }); await enter();
      const before = await card.boundingBox(); dimensions[width] = before;
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow at ${width}`);
      for (const box of await card.locator('.digimon-controls button').evaluateAll(items => items.map(el => ({ width: el.offsetWidth, height: el.offsetHeight })))) assert.ok(box.height >= 44 && box.width >= 44, `Touch controls at ${width}`);
      const spriteBounds = await card.locator('.digimon-sprite').boundingBox();
      const habitatBounds = await card.locator('.digimon-habitat').boundingBox();
      assert.ok(spriteBounds.x >= habitatBounds.x && spriteBounds.x + spriteBounds.width <= habitatBounds.x + habitatBounds.width, `Sprite bounded at ${width}`);
      await card.getByRole('button', { name: /A note from Jose/ }).click(); await page.waitForTimeout(760);
      assert.equal(await card.locator('.digimon-front').getAttribute('inert'), '');
      assert.ok(Math.abs((await card.boundingBox()).height - before.height) < 1, `Flip height stable at ${width}`);
      if (width === 1440 || width === 390) await card.screenshot({ path: `.preview/digimon-note-${label}.png`, ...shotOptions });
      await card.getByRole('button', { name: /Back to/ }).click(); await page.waitForTimeout(760);
      await page.evaluate(() => document.activeElement?.blur());
      if (width !== 320) await page.locator('#about').screenshot({ path: `.preview/digimon-${label}.png`, ...shotOptions });
    }
    await page.setViewportSize({ width: 1440, height: 1000 }); await enter();
    await control('Pause').click(); const paused = await still(); await page.waitForTimeout(800); assert.equal(await still(), paused);
    await control('Resume').click();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100);
    const reduced = await still(); await page.waitForTimeout(800); assert.equal(await still(), reduced);
    await card.getByRole('button', { name: /A note from Jose/ }).focus(); await page.keyboard.press('Enter');
    assert.equal(await card.locator('.digimon-front').getAttribute('inert'), '');
    assert.equal(await card.locator('.digimon-flipper').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await page.keyboard.press('Tab'); assert.equal(await control('Pause').evaluate(el => el === document.activeElement), true);
    await card.getByRole('button', { name: /Back to/ }).click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#work').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
    const offscreen = await still(); await page.waitForTimeout(800); assert.equal(await still(), offscreen);
    await enter();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(100); const hidden = await still(); await page.waitForTimeout(800); assert.equal(await still(), hidden);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    console.log('Responsive and accessibility checks passed: five widths, stable flip, keyboard, reduced motion, pause, offscreen and hidden-tab suspension.');

    const stages = ['agumon', 'greymon', 'metalgreymon', 'wargreymon'];
    const names = ['Agumon', 'Greymon', 'MetalGreymon', 'WarGreymon'];
    let stageHeight;
    for (let index = 0; index < stages.length; index++) {
      await seed({ ...createPet(Date.now()), stage: stages[index], activeAgeMs: 0 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const height = (await card.boundingBox()).height;
      if (stageHeight) assert.ok(Math.abs(height - stageHeight) < 1, 'Evolution must preserve card height');
      stageHeight = height;
      assert.equal(await card.locator('.digimon-identity h3').textContent(), names[index]);
      assert.equal(await card.locator('.is-unavailable').count(), 0);
      await card.screenshot({ path: `.preview/digimon-${stages[index]}.png`, ...shotOptions });
      if (index === 3) { await control('Feed').click(); assert.match(await card.getByRole('status').textContent(), /Snack/); break; }
      // Qualify only the current transition; training/time for later stages remain below threshold.
      const activeAgeMs = [120000, 300000, 540000][index];
      const training = [24, 56, 96][index];
      await seed({ ...createPet(Date.now()), stage: stages[index], activeAgeMs, training, food: 100, energy: 100, happiness: 100 });
      await card.locator('.digimon-evolution').waitFor();
      assert.equal(await control('Feed').isDisabled(), true);
      assert.equal((await saved()).pendingStage, stages[index + 1]);
      if (index === 0) { await page.reload(); await enter(); }
      await page.waitForFunction(name => document.querySelector('.digimon-identity h3')?.textContent === name, names[index + 1]);
      assert.equal((await saved()).stage, stages[index + 1]);
      await page.waitForTimeout(100); assert.equal(await card.locator('.is-unavailable').count(), 0);
    }
    console.log('Evolution browser checks passed: all four stages, action lock, mid-transition reload, stable height and continued Mega care.');

    await page.evaluate(() => sessionStorage.setItem('pet-test-seed', '{damaged')); await page.reload(); await enter();
    assert.match(await card.locator('.digimon-storage-notice').textContent(), /damaged save/);
    await control('Feed').click(); assert.equal((await saved()).stage, 'agumon');
    const denied = await browser.newPage();
    await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied for test'); } }));
    await denied.goto(url); const deniedCard = denied.locator('.digimon-card'); await deniedCard.scrollIntoViewIfNeeded();
    assert.match(await deniedCard.locator('.digimon-storage-notice').textContent(), /This visit only/);
    await deniedCard.getByRole('button', { name: 'Feed', exact: true }).click(); assert.match(await deniedCard.getByRole('status').textContent(), /Snack/);
    await denied.close();
    await page.route('**/sprites/digimon/agumon.png', route => route.abort());
    await page.reload(); await enter(); await card.locator('.is-unavailable').waitFor();
    assert.match(await card.locator('.is-unavailable').textContent(), /Agumon.*Sprite unavailable/);
    assert.equal(await page.locator('#services').count(), 1);
    assert.equal(await page.locator('#playground').count(), 1);
    assert.equal(await page.locator('#work').count(), 1);
    const credits = await page.request.get(`${url}/sprites/digimon/credits.txt`); assert.equal(credits.status(), 200); assert.match(await credits.text(), /RadSpyro/);
    assert.deepEqual(errors, []);
    fs.writeFileSync('.preview/digimon-browser-results.json', JSON.stringify({ widths: dimensions, errors, status: 'passed' }, null, 2));
    console.log('Recovery checks passed: corrupt/denied saves, missing sprite fallback, credits and neighboring sections. No uncaught page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
