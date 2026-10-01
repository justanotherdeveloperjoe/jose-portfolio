const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SERVICES_URL || 'http://127.0.0.1:4173';

(async () => {
  fs.mkdirSync('.preview', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    const section = page.locator('#services');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services', exact: true }).click();
    await section.scrollIntoViewIfNeeded();
    assert.equal(await section.locator('.service-card').count(), 3);
    assert.equal(await section.getByText('Starting at · USD', { exact: true }).count(), 2);
    assert.equal(await section.getByText('$300', { exact: true }).count(), 1);
    assert.equal(await section.getByText('$650', { exact: true }).count(), 1);
    for (const [id, name, url] of [['launch', 'Launch', 'http://smashouseburger.com/'], ['business', 'Business Website', 'https://afh.mx'], ['custom', 'Custom Build', 'https://elsotanocomico.com']]) {
      const card = section.locator(`.service-${id}`);
      assert.ok((await card.locator('.service-features li').count()) >= 5);
      assert.equal(await card.locator('.service-example a').getAttribute('href'), id === 'custom' ? '#service-case-study' : url);
      const mail = new URL(await card.locator('.service-inquiry').getAttribute('href'));
      assert.equal(mail.protocol, 'mailto:');
      assert.equal(mail.pathname, 'devilfruitd3v@proton.me');
      assert.match(mail.searchParams.get('subject'), new RegExp(name));
      assert.match(mail.searchParams.get('body'), /My business \/ idea:/);
    }
    await page.waitForFunction(() => [...document.querySelectorAll('#services img')].every(image => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('#p04').count(), 1);
    assert.equal(await page.locator('.workbench-card').count(), 3);
    assert.equal(await page.locator('.studio-comedy').getAttribute('id'), 'p05');
    assert.equal(await page.locator('.studio-logistics').getAttribute('id'), 'p07');
    assert.equal(await page.locator('.studio-deck-card').count(), 4);
    assert.equal(requests.some(url => /LinuxDesktop/.test(url)), false, 'Services must not start the Linux desktop');

    const business = section.locator('.service-business');
    const phone = business.locator('.service-business-phone');
    const desktopWidth = (await phone.boundingBox()).width;
    await business.getByRole('button', { name: 'Mobile', exact: true }).click();
    await page.waitForTimeout(650);
    assert.ok((await phone.boundingBox()).width > desktopWidth * 1.3);
    assert.equal(await business.getByRole('button', { name: 'Mobile', exact: true }).getAttribute('aria-pressed'), 'true');
    await business.getByRole('button', { name: 'Desktop', exact: true }).click();
    const title = section.getByLabel('Make it yours', { exact: true });
    await section.getByRole('button', { name: 'Interact with demo' }).click();
    assert.equal(await title.evaluate(node => node === document.activeElement), true);
    await title.fill('COMEDY NIGHT');
    assert.equal(await section.locator('.service-demo-poster strong').innerText(), 'COMEDY NIGHT');
    await section.getByRole('button', { name: 'Apricot ink' }).click();
    assert.equal(await section.locator('.service-live-demo').evaluate(node => node.style.getPropertyValue('--demo-accent')), '#edaa83');
    const merch = section.getByRole('button', { name: 'Try it on merch' });
    await merch.focus(); await page.keyboard.press('Enter');
    assert.equal(await merch.getAttribute('aria-pressed'), 'true');
    await section.getByRole('img', { name: 'T-shirt design: COMEDY NIGHT' }).waitFor();
    const sticker = section.getByRole('button', { name: /Move the sticker/ });
    await sticker.scrollIntoViewIfNeeded();
    const box = await sticker.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 45, box.y + box.height / 2 + 30, { steps: 8 }); await page.mouse.up();
    assert.ok(parseFloat(await sticker.evaluate(node => node.style.getPropertyValue('--sticker-x'))) < -5);
    await sticker.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowLeft');
    assert.equal(await sticker.evaluate(node => node.style.getPropertyValue('--sticker-x')), '-3%');
    await section.getByRole('button', { name: 'Reset demo' }).click();
    assert.equal(await title.inputValue(), 'OPEN MIC');
    assert.equal(await sticker.evaluate(node => node.style.getPropertyValue('--sticker-x')), '0%');
    const caseLink = section.getByRole('link', { name: 'View case study' });
    await caseLink.click();
    const caseStudy = section.locator('#service-case-study');
    await caseStudy.waitFor({ state: 'visible' });
    assert.equal(await caseStudy.getByRole('link', { name: 'View the live project' }).getAttribute('href'), 'https://elsotanocomico.com');
    assert.equal(await caseStudy.locator('h3').evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Escape');
    await caseStudy.waitFor({ state: 'hidden' });
    assert.equal(await caseLink.evaluate(node => node === document.activeElement), true);

    const custom = section.locator('.service-custom');
    await custom.hover({ position: { x: 20, y: 90 } });
    await page.waitForTimeout(500);
    assert.notEqual(await custom.evaluate(node => node.style.getPropertyValue('--service-x')), '0');
    await page.mouse.move(0, 0);
    assert.equal(await custom.evaluate(node => node.style.getPropertyValue('--service-x')), '0');
    await section.screenshot({ path: '.preview/services-desktop.png' });

    // The new live project remains reachable from the existing hero deck.
    for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next project preview', exact: true }).click();
    assert.equal(await page.locator('.deck-position-0').getAttribute('href'), '#p04');
    await page.locator('.deck-position-0').click();
    assert.equal(new URL(page.url()).hash, '#p04');

    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await section.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, `Page overflow at ${width}`);
      const nav = await page.getByRole('navigation', { name: 'Main navigation' }).boundingBox();
      assert.ok(nav.x >= 0 && nav.x + nav.width <= width + 1, `Navigation clipped at ${width}`);
      for (const card of await section.locator('.service-card:not(.service-custom)').all()) {
        assert.ok(await card.evaluate(node => node.scrollWidth - node.clientWidth) <= 1, `Card overflow at ${width}`);
      }
      const demo = await section.locator('.service-live-demo').boundingBox();
      assert.ok(demo.x >= 0 && demo.x + demo.width <= width, `Demo clipped at ${width}`);
      await business.getByRole('button', { name: 'Mobile', exact: true }).click();
      await page.waitForTimeout(600);
      const device = await phone.boundingBox(), switchBox = await business.locator('.service-device-switch').boundingBox();
      assert.ok(device.y + device.height <= switchBox.y + 1, `Mobile preview overlaps controls at ${width}`);
      await business.getByRole('button', { name: 'Desktop', exact: true }).click();
      if (width === 390 || width === 1024) await section.screenshot({ path: `.preview/services-${width}.png` });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await custom.hover({ position: { x: 25, y: 60 } });
    assert.equal(await custom.evaluate(node => getComputedStyle(node).transform), 'none');
    assert.equal(await custom.evaluate(node => node.style.getPropertyValue('--service-x')), '0');
    await merch.click();
    await section.getByRole('img', { name: 'T-shirt design: OPEN MIC' }).waitFor();
    assert.equal(await section.locator('.service-demo-merch').evaluate(node => getComputedStyle(node).transform), 'none');
    await business.getByRole('button', { name: 'Mobile', exact: true }).click();
    assert.equal(await business.getByRole('button', { name: 'Mobile', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
    await page.goto(base + '/?view=original');
    assert.equal(await page.locator('#services').count(), 0);
    console.log('Services: prices/links, inquiry content, project integration, preview controls, cursor/reduced motion, and responsive layouts: PASS');
  } catch (error) {
    await page.screenshot({ path: '.preview/services-failure.png' });
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
