const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [], sends = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (req.method() === 'POST') sends.push({ url: req.url(), body: req.postData() }); });
    // Delivery is mocked: the check never emails anyone.
    let reply = { status: 400, body: { success: false, message: 'Rejected' } };
    await page.route('https://api.web3forms.com/submit', route => route.fulfill({ status: reply.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply.body) }));
    await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
    await page.locator('.studio-nav-contact').click();
    const section = page.locator('#contact');
    assert.equal(await section.locator('input').count(), 2);
    assert.equal(await section.locator('textarea').count(), 1);
    assert.equal(await page.locator('a[href^="mailto:"]').count(), 0);
    assert.equal(await section.locator('.contact-submit').isDisabled(), false);
    assert.doesNotMatch(await section.innerText(), /Messaging opens soon/);
    assert.equal(await section.locator('.contact-form').getAttribute('action'), null);
    await page.locator('#contact-name').focus();
    assert.equal(await page.locator('#contact-name').evaluate(el => el.matches(':focus-visible')), true);
    await page.keyboard.type('A visitor');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#contact-email').evaluate(el => el === document.activeElement), true);
    await page.locator('#contact-email').fill('visitor@example.com');
    await page.locator('#contact-message').fill('I have a website idea.');
    await page.locator('#contact-email').fill('');
    await section.locator('form').evaluate(form => form.requestSubmit());
    assert.deepEqual(sends, [], 'Missing email blocks the send');
    await page.locator('#contact-email').fill('visitor@example.com');
    await section.locator('form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => /couldn.t be sent/.test(document.querySelector('.contact-feedback').textContent));
    assert.equal(sends.length, 1, 'One request per attempt');
    assert.equal(sends[0].url, 'https://api.web3forms.com/submit');
    assert.equal(await page.locator('#contact-message').inputValue(), 'I have a website idea.');
    assert.equal(await page.locator('#contact-name').inputValue(), 'A visitor');
    assert.equal(await section.locator('.contact-submit').isDisabled(), false, 'A rejected send can be retried');
    reply = { status: 200, body: { success: true, message: 'Email sent successfully!' } };
    await section.locator('form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => /Message sent/.test(document.querySelector('.contact-feedback').textContent));
    assert.equal(sends.length, 2);
    const payload = JSON.parse(sends[1].body);
    assert.match(payload.access_key, /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);
    assert.deepEqual({ name: payload.name, email: payload.email, message: payload.message }, { name: 'A visitor', email: 'visitor@example.com', message: 'I have a website idea.' });
    assert.match(payload.subject, /A visitor/);
    assert.equal(await section.locator('.contact-submit').isDisabled(), true, 'A delivered message cannot repeat until edited');
    await section.locator('form').evaluate(form => form.requestSubmit());
    assert.equal(sends.length, 2, 'No duplicate send');
    const templates = new Set();
    for (const [id, name, phrase] of [['launch', 'Launch', 'landing page'], ['business', 'Business Website', 'multi-page'], ['custom', 'Custom Build', 'custom website']]) {
      const inquiry = page.locator('.service-' + id + ' .service-inquiry');
      if (id === 'business') { await inquiry.focus(); await page.keyboard.press('Enter'); }
      else await inquiry.click();
      await page.waitForFunction(() => document.activeElement?.id === 'contact-message');
      const message = await page.locator('#contact-message').inputValue();
      assert.ok(message.includes(name), 'Correct package: ' + name);
      assert.ok(message.includes(phrase), 'Specific request: ' + name);
      templates.add(message);
      assert.equal(await page.locator('#contact-name').inputValue(), 'A visitor');
      assert.equal(await page.locator('#contact-email').inputValue(), 'visitor@example.com');
      assert.equal(new URL(page.url()).hash, '#contact');
    }
    assert.equal(templates.size, 3, 'Distinct ready-to-edit messages');
    await page.locator('#contact-message').fill('My custom project: an appointment booking site.');
    await page.locator('.service-launch .service-inquiry').click();
    await page.locator('.service-custom .service-inquiry').click();
    await page.waitForFunction(() => document.querySelector('#contact-message').value === 'My custom project: an appointment booking site.');
    await page.locator('.service-custom .service-inquiry').click();
    await page.waitForFunction(() => document.querySelector('#contact-message').value === 'My custom project: an appointment booking site.');
    assert.equal(await section.locator('.contact-submit').isDisabled(), false, 'A new draft can be sent');
    assert.equal(sends.length, 2, 'Choosing a package does not send anything');
    for (const field of ['name', 'email', 'message']) await page.locator('#contact-' + field).fill('');
    await page.locator('#contact-message').blur();
    fs.mkdirSync('.preview', { recursive: true });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await section.scrollIntoViewIfNeeded();
      const overflow = await section.evaluate(el => [...el.querySelectorAll('*')].filter(node => { if (node.classList.contains('contact-sr-only')) return false; const r = node.getBoundingClientRect(); return r.width > 1 && (r.left < -1 || r.right > innerWidth + 1); }).map(node => node.className));
      assert.deepEqual(overflow, [], 'No contact overflow at ' + width);
      await section.screenshot({ path: `.preview/contact-clean-${width}.png` });
      if (width === 1440) assert.ok((await section.boundingBox()).height < 600, 'Compact desktop section');
    }
    assert.equal(await page.locator('.contact-submit > span').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#contact-name').fill('Touch-sized input');
    assert.ok(parseFloat(await page.locator('#contact-name').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
    assert.deepEqual(errors, []);
    console.log('PASS: three service drafts, keyboard selection, per-package draft retention, preserved contact details, no auto-send, compact desktop and 768/390/320 layouts, keyboard access, no public email links, mocked Web3Forms delivery (rejection keeps input and allows retry, success sends once with the visitor details), reduced motion, no page errors.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
