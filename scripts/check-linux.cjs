// Browser check for the Linux desktop sandbox (v86 + xterm.js).
// Run with Playwright installed, or set PLAYWRIGHT_MODULE to an existing install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SANDBOX_URL || 'http://127.0.0.1:4173';

(async () => {
  fs.mkdirSync('.preview', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(base, { waitUntil: 'networkidle' });
    const sandbox = page.locator('#sandbox');
    await sandbox.scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.linux-desktop').count(), 0);
    assert.equal(requests.some(url => /LinuxDesktop/.test(url)), false, 'Desktop must not load before open');
    await sandbox.screenshot({ path: '.preview/linux-closed.png' });

    const launch = sandbox.getByRole('button', { name: 'Open desktop' });
    await launch.click();
    assert.ok(requests.some(url => /LinuxDesktop/.test(url)), 'Desktop chunk should load after open');

    console.log('Waiting for Linux to boot...');
    await page.getByText('Linux 6.8 · ready').waitFor({ timeout: 60000 });
    console.log('Boot reached ready state.');

    const term = page.locator('.linux-terminal');
    await term.click();
    await page.keyboard.type('echo hello-from-terminal\n');
    await page.getByText('hello-from-terminal').first().waitFor({ timeout: 5000 });

    await page.keyboard.type('echo "note body" > /mnt/idea.txt\n');
    await page.waitForTimeout(600);

    const dock = page.getByRole('navigation', { name: 'Desktop applications' });
    assert.equal(await dock.getByRole('button').count(), 6);
    assert.equal(await page.locator('.linux-icons').count(), 0);
    const filesIcon = dock.getByRole('button', { name: 'Files', exact: true });
    await filesIcon.click();
    const fileList = page.locator('.linux-file-list');
    await fileList.getByText('idea.txt', { exact: false }).first().waitFor({ timeout: 5000 });
    await sandbox.screenshot({ path: '.preview/linux-files.png' });

    await fileList.getByText('idea.txt', { exact: false }).first().click();
    await page.locator('#linux-note').waitFor({ timeout: 5000 });
    assert.match(await page.locator('#linux-note').inputValue(), /note body/);
    await dock.getByRole('button', { name: 'Notes', exact: true }).click();
    assert.equal(await page.locator('.linux-window-notes').count(), 1);
    assert.equal(await page.locator('.linux-terminal-keys').count(), 0);

    await page.locator('#linux-note').fill('note body\nedited from Notes\n');
    await page.getByRole('button', { name: /^Save/ }).click();
    await page.getByText('Saved in Linux.').waitFor({ timeout: 5000 });
    await sandbox.screenshot({ path: '.preview/linux-notes.png' });

    await page.locator('.linux-taskbar').getByRole('button', { name: 'Terminal' }).click();
    await term.click();
    await page.keyboard.type('cat /mnt/idea.txt\n');
    await page.getByText('edited from Notes').first().waitFor({ timeout: 5000 });
    console.log('Files/Notes/Terminal share one filesystem.');

    // Download a file from the Files window.
    await filesIcon.click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download idea.txt' }).click();
    assert.equal((await download).suggestedFilename(), 'idea.txt');

    // Window drag: moving the title bar should not throw or freeze the app.
    const titleBar = page.locator('.linux-window-terminal .linux-window-title');
    await dock.getByRole('button', { name: 'Terminal', exact: true }).click();
    const box = await titleBar.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 90, { steps: 5 });
    await page.mouse.up();
    const moved = await titleBar.boundingBox();
    assert.ok(moved.x > box.x + 50, 'Dragging moves the terminal window');

    // Real guest metrics over the second serial port; primary input stays intact.
    await term.click();
    await page.keyboard.type('echo input-survived');
    await dock.getByRole('button', { name: 'Monitor', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.linux-processes')?.textContent.includes('PID'), null, { timeout: 15000 });
    assert.match(await page.locator('.linux-processes').textContent(), /init/);
    assert.match(await page.locator('.linux-stat-grid').textContent(), /of \d+/);
    await sandbox.screenshot({ path: '.preview/linux-monitor.png' });
    await dock.getByRole('button', { name: 'Appearance', exact: true }).click();
    await page.getByRole('radio', { name: 'Dusk', exact: true }).check();
    await page.getByRole('radio', { name: 'Sand', exact: true }).check();
    const fontSize = page.getByRole('slider', { name: 'Terminal text size' });
    await fontSize.fill('16');
    assert.equal(await page.locator('.linux-scene-dusk.linux-screen').count(), 1);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('studio-linux-appearance')).fontSize), 16);
    await sandbox.screenshot({ path: '.preview/linux-appearance.png' });
    await dock.getByRole('button', { name: 'Terminal', exact: true }).click();
    await term.click();
    await page.keyboard.press('Enter');
    await page.getByText('input-survived', { exact: true }).first().waitFor({ timeout: 5000 });
    await page.keyboard.type('stty size > /mnt/size.txt\n');
    await page.waitForTimeout(500);
    await filesIcon.click();
    await page.locator('.linux-file-list').getByText('size.txt', { exact: true }).click();
    const guestSize = await page.locator('#linux-note').inputValue();
    assert.match(guestSize, /^\d+ \d+\s*$/);
    assert.ok(Number(guestSize.trim().split(/\s+/)[1]) > 25, `Guest terminal columns: ${guestSize}`);
    console.log('Monitor reads real Linux processes; Appearance preserves terminal input and resizes the guest.');

    // Pause/resume.
    await page.locator('.linux-topbar').getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByText('Your computer is paused.').waitFor({ timeout: 5000 });
    await page.getByRole('button', { name: 'Resume Linux' }).first().click();
    await page.getByText('Linux 6.8 · ready').waitFor({ timeout: 5000 });

    // Welcome window: arcade bridge and restart confirmation.
    const welcomeIcon = page.getByRole('button', { name: 'Desktop help' });
    await welcomeIcon.click();
    await page.getByRole('button', { name: 'Restart Linux…' }).click();
    await page.getByText('Start a fresh session?').waitFor();
    await page.getByRole('button', { name: 'Keep working' }).click();

    // Responsive layouts.
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await dock.getByRole('button', { name: 'Appearance', exact: true }).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, `Overflow at ${width}px: ${overflow}`);
      const desktopOverflow = await page.locator('.linux-desktop').evaluate(node => node.scrollWidth - node.clientWidth);
      assert.ok(desktopOverflow <= 1, `Desktop overflow at ${width}px: ${desktopOverflow}`);
      if (width === 390) await sandbox.screenshot({ path: '.preview/linux-mobile.png' });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await welcomeIcon.click();
    await page.getByRole('button', { name: 'Visit the arcade ↗' }).click();
    await page.getByRole('button', { name: 'Start a round' }).waitFor({ timeout: 5000 });
    console.log('Arcade bridge works.');

    assert.deepEqual(errors, []);

    // Closing pauses the emulator and hides the panel (it does not unmount: reopening
    // during the same visit should resume without rebooting). Focus returns to the launcher.
    await page.getByRole('button', { name: 'Close desktop' }).first().click();
    assert.equal(await page.locator('#sandbox-panel').getAttribute('aria-hidden'), 'true');
    assert.equal(await sandbox.getByRole('button', { name: 'Open desktop' }).evaluate(node => node === document.activeElement), true);
    await sandbox.getByRole('button', { name: 'Open desktop' }).click();
    await page.getByText('Linux 6.8 · ready').waitFor({ timeout: 5000 });
    console.log('Close/reopen resumes the same session without rebooting.');
    await page.getByRole('button', { name: 'Close desktop' }).first().click();

    await page.reload();
    await page.getByRole('button', { name: 'Open desktop' }).click();
    await page.getByRole('navigation', { name: 'Desktop applications' }).getByRole('button', { name: 'Appearance', exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: 'Dusk', exact: true }).isChecked(), true);
    assert.equal(await page.getByRole('radio', { name: 'Sand', exact: true }).isChecked(), true);
    assert.equal(await page.getByRole('slider', { name: 'Terminal text size' }).inputValue(), '16');
    await page.getByRole('button', { name: 'Restore defaults', exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: 'Forest', exact: true }).isChecked(), true);

    await page.goto(base + '/?view=original');
    assert.equal(await page.locator('#sandbox').count(), 0);

    // A failed deferred download leaves the page usable and exposes recovery.
    const retry = await browser.newPage();
    await retry.route('**/LinuxDesktop-*.js', route => route.abort());
    await retry.goto(base);
    await retry.getByRole('button', { name: 'Open desktop' }).click();
    await retry.getByRole('button', { name: 'Reload page' }).waitFor();
    await retry.unroute('**/LinuxDesktop-*.js');
    await Promise.all([retry.waitForEvent('load'), retry.getByRole('button', { name: 'Reload page' }).click()]);
    await retry.getByRole('button', { name: 'Open desktop' }).click();
    await retry.locator('.linux-desktop').waitFor({ timeout: 5000 });
    await retry.close();

    console.log('Boot, shared files, drag, live Monitor, Appearance persistence, preserved terminal input, pause/resume, responsive layouts, arcade, focus, original view and chunk recovery: PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
