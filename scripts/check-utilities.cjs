const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SANDBOX_URL || 'http://127.0.0.1:4173';

(async () => {
  fs.mkdirSync('.preview', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base);
    await page.getByRole('button', { name: 'Open desktop' }).click();
    await page.getByText('Linux 6.8 · ready').waitFor({ timeout: 60000 });
    const dock = page.getByRole('navigation', { name: 'Desktop applications' });
    assert.equal(await dock.getByRole('button').count(), 6);
    async function open(name) {
      await dock.getByRole('button', { name: 'Utilities', exact: true }).click();
      await page.locator('.linux-utilities-grid').getByRole('button', { name: new RegExp(name) }).click();
    }
    await dock.getByRole('button', { name: 'Utilities', exact: true }).click();
    await page.locator('.linux-desktop').screenshot({ path: '.preview/linux-utilities.png' });
    await open('Calculator');
    const calculation = page.getByRole('textbox', { name: 'Calculation', exact: true });
    await calculation.fill('2 + 3 * (4 - 1)'); await calculation.press('Enter');
    assert.equal(await page.getByLabel('Calculation result', { exact: true }).textContent(), '11');
    await page.locator('.linux-calculator-keys').getByRole('button', { name: '+', exact: true }).click();
    await page.locator('.linux-calculator-keys').getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();
    assert.equal(await page.getByLabel('Calculation result', { exact: true }).textContent(), '13');
    await calculation.fill('5/0'); await calculation.press('Enter');
    await page.getByText('Cannot divide by zero.').waitFor();
    await page.getByRole('button', { name: 'Close Calculator', exact: true }).click();
    await open('Calculator');
    assert.equal(await calculation.inputValue(), '5/0');
    assert.equal(await page.locator('.linux-window-calculator').count(), 1);

    await open('Calendar');
    await page.getByRole('textbox', { name: 'New reminder' }).fill('Practice React tomorrow');
    await page.locator('.linux-reminders').getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByText('Practice React tomorrow', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Next month' }).click();
    assert.equal(await page.getByText('Practice React tomorrow', { exact: true }).count(), 1, 'Selected day stays selected during month navigation');
    await page.getByRole('button', { name: 'Back to today' }).click();
    await page.locator('.linux-window-calendar').screenshot({ path: '.preview/linux-calendar.png' });

    await open('Focus Timer');
    await page.getByRole('spinbutton', { name: 'Focus minutes' }).fill('1');
    await page.getByRole('button', { name: 'Start timer', exact: true }).click();
    await page.waitForTimeout(1100);
    const timer = page.getByLabel('Timer time', { exact: true });
    assert.notEqual(await timer.textContent(), '01:00');
    await page.getByRole('button', { name: 'Pause timer', exact: true }).click();
    const paused = await timer.textContent(); await page.waitForTimeout(1100);
    assert.equal(await timer.textContent(), paused);
    await page.getByRole('button', { name: 'Resume timer', exact: true }).click();
    // Advance the timer's wall clock without changing Linux's performance clock.
    await page.evaluate(() => { window.originalUtilityNow = Date.now; Date.now = () => window.originalUtilityNow() + 65000; });
    await page.getByText('Focus session complete.', { exact: true }).waitFor();
    assert.equal(await timer.textContent(), '00:00');
    await page.evaluate(() => { Date.now = window.originalUtilityNow; delete window.originalUtilityNow; });
    await page.getByRole('button', { name: 'Stopwatch', exact: true }).click();
    await page.getByRole('button', { name: 'Start timer', exact: true }).click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Close desktop', exact: false }).first().click();
    const closedTime = await timer.textContent();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: 'Open desktop' }).click();
    assert.equal(await timer.textContent(), closedTime);
    await page.getByRole('button', { name: 'Resume timer', exact: true }).waitFor();
    await page.locator('.linux-window-timer').screenshot({ path: '.preview/linux-timer.png' });

    await open('Sketchpad');
    const canvas = page.locator('.linux-sketchpad canvas');
    const box = await canvas.boundingBox();
    const original = await canvas.evaluate(node => node.toDataURL());
    await page.mouse.move(box.x + 40, box.y + 40); await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + 100, { steps: 12 }); await page.mouse.up();
    await page.getByText('1 stroke', { exact: true }).waitFor();
    await page.waitForTimeout(50);
    const drawn = await canvas.evaluate(node => node.toDataURL());
    assert.notEqual(drawn, original);
    await page.getByRole('button', { name: 'Close Sketchpad', exact: true }).click();
    await open('Sketchpad');
    assert.equal(await canvas.evaluate(node => node.toDataURL()), drawn);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.waitForTimeout(50);
    assert.equal(await canvas.evaluate(node => node.toDataURL()), original);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
    assert.equal((await download).suggestedFilename(), 'studio-sketch.png');
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    const touchBox = await canvas.boundingBox();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchBox.x + 40, y: touchBox.y + 40, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchBox.x + 90, y: touchBox.y + 70, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.getByText('1 stroke', { exact: true }).waitFor();
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await session.detach();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByRole('button', { name: 'Keep drawing', exact: true }).click();
    await page.getByText('1 stroke', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByRole('button', { name: 'Clear sketch', exact: true }).click();
    await page.waitForTimeout(50);
    assert.equal(await canvas.evaluate(node => node.toDataURL()), original);

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ['Calculator', 'Calendar', 'Focus Timer', 'Sketchpad']) {
        await open(name);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 1, `${name} page overflow at ${width}`);
        const active = page.locator('.linux-window.is-front');
        assert.ok(await active.evaluate(node => node.scrollWidth - node.clientWidth) <= 1, `${name} window overflow at ${width}`);
        if (width === 390) await page.locator('.linux-desktop').screenshot({ path: `.preview/utility-mobile-${name.replace(' ', '-')}.png` });
      }
    }
    await page.reload(); await page.getByRole('button', { name: 'Open desktop' }).click();
    await open('Calendar');
    await page.getByText('Practice React tomorrow', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Remove reminder: Practice React tomorrow' }).click();
    assert.equal(await page.getByText('Practice React tomorrow', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('Utilities: calculation, reminders/persistence, timer/stopwatch/pause, sketch/undo/PNG, window reuse, and mobile layouts: PASS');
  } catch (error) {
    await page.screenshot({ path: '.preview/utilities-failure.png', fullPage: false });
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
