const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173';
// A fixed afternoon in Monterrey (16:41, sun 20° up in the west-southwest) keeps colors and readouts predictable.
const afternoon = new Date('2026-10-12T22:41:00Z');
const sunCentre = page => page.evaluate(() => { const r = document.querySelector('.composition-sun circle:last-child').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
(async()=>{
 const browser=await chromium.launch(), flat=await chromium.launch({args:['--disable-3d-apis']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(afternoon);
  await page.goto(base,{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready);
  const lab=page.locator('.composition-playground'), canvas=lab.locator('.composition-canvas'), readout=lab.locator('.composition-readout');
  const tab=name=>lab.getByRole('tab',{name:new RegExp(name)});
  const baselinePath=process.env.PLAYGROUND_BASELINE || '.preview/playground-baseline.json';
  const baseline=fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath,'utf8')) : {};
  // GSAP can settle an offscreen postcard to this neutral transform after scrolling.
  const normalize=html=>html.replace(/ style="(?:translate: none; rotate: none; scale: none; transform: translate\(0px, 0px\);)?"/g,'').replace(/\b\d{2}:\d{2}\b/g,'TIME');
  assert.equal(await lab.getByRole('tab').count(),4);
  assert.equal(await lab.locator('canvas.composition-sky').count(),1,'The print shader draws the poster');
  assert.match(await readout.textContent(),/^Live · 16:41 · Sun 20° up/);
  assert.match(await canvas.getAttribute('aria-label'),/Cerro de la Silla and the Sierra Madre at 16:41/);
  // Data credits stay visible below the controls; MET Norway is credited whenever the weather relay answers.
  const relay=await page.evaluate(()=>fetch('/api/weather.php').then(reply=>reply.status).catch(()=>0));
  assert.match(await lab.locator('.composition-sources').textContent(),relay===200?/MET Norway.*INEGI.*USGS SRTM/:/INEGI.*USGS SRTM/);
  assert.equal(await lab.locator('.composition-credits').getAttribute('open'),null,'The story starts folded');
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000}); await lab.getByRole('button',{name:/Reset/}).click();
   await tab('Motion').click(); await page.evaluate(()=>document.activeElement?.blur());
   if(baseline[width])for(const [selector,expected]of Object.entries(baseline[width])){
    const actual=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return{html:el.outerHTML,width:r.width,height:r.height}});
    const actualHtml=normalize(actual.html), expectedHtml=normalize(expected.html);
    const firstDifference=[...actualHtml].findIndex((character,index)=>character!==expectedHtml[index]);
    assert.ok(actualHtml===expectedHtml,`${selector} content changed at ${firstDifference}: ${actualHtml.slice(firstDifference,firstDifference+160)} / expected ${expectedHtml.slice(firstDifference,firstDifference+160)}`);
    assert.ok(Math.abs(actual.width-expected.width)<1&&Math.abs(actual.height-expected.height)<1,`${selector} size changed at ${width}`);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}`);
   assert.ok(await canvas.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   const bounds=await canvas.evaluate(el=>{const r=el.getBoundingClientRect(),t=el.querySelector('.composition-title').getBoundingClientRect(),n=el.querySelector('.composition-note').getBoundingClientRect();return{right:r.right,titleRight:t.right,titleBottom:t.bottom,noteTop:n.top,noteRight:n.right,noteBottom:n.bottom,bottom:r.bottom};});
   assert.ok(bounds.noteRight<=bounds.right+1 && bounds.noteBottom<=bounds.bottom, `Copy clipped at ${width}`);
   assert.ok(bounds.titleRight<=bounds.right+1,`Heading clipped at ${width}`);
   if(width<700)assert.ok(bounds.titleBottom<bounds.noteTop,`Title/copy overlap at ${width}`);
   await page.locator('#playground').screenshot({path:`.preview/playground-${width}.png`});
   if(width!==320)await page.screenshot({path:`.preview/playground-page-${width}.png`,fullPage:true});
   console.log(`${width}px: print fits; neighboring sections unchanged.`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await tab('Motion').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await tab('Layout').getAttribute('aria-selected'),'true');
  const wide=(await canvas.boundingBox()).width;
  await lab.getByLabel('Canvas width').fill('25');
  assert.ok((await canvas.boundingBox()).width<wide*.5);
  await tab('Type').click(); await lab.getByRole('slider',{name:/^Weight/}).fill('700'); await lab.getByLabel('Letter spacing').fill('2');
  assert.equal(await lab.locator('.composition-title > span').evaluate(el=>getComputedStyle(el).fontWeight),'700');
  await tab('Color').click(); await lab.getByRole('button',{name:'Midnight',exact:true}).click();
  assert.equal(await canvas.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(32, 52, 68)');
  await tab('Layout').click(); assert.equal(await lab.getByLabel('Canvas width').inputValue(),'25');
  await page.evaluate(()=>document.activeElement?.blur());
  await lab.screenshot({path:'.preview/playground-customized.png'});
  // Time: 15-minute steps from the keyboard, back to live, and Reset restores everything including the clock.
  await tab('Motion').click(); const time=lab.getByLabel('Time of day');
  await time.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  assert.match(await readout.textContent(),/^17:11 ·/); assert.match(await lab.locator('.composition-control-intro > span').textContent(),/replay/);
  await lab.getByRole('button',{name:/^Live/}).click(); assert.match(await readout.textContent(),/^Live · 16:41/);
  await time.fill('300');
  await lab.getByRole('button',{name:/Reset/}).click();
  assert.match(await readout.textContent(),/^Live/);
  assert.equal(await lab.getByLabel('Time of day').inputValue(),'1001');
  await tab('Layout').click(); assert.equal(await lab.getByLabel('Canvas width').inputValue(),'100');
  await tab('Type').click(); assert.equal(await lab.getByRole('slider',{name:/^Weight/}).inputValue(),'500'); assert.equal(await lab.getByLabel('Letter spacing').inputValue(),'-4');
  await tab('Color').click(); assert.equal(await lab.getByRole('button',{name:'Olive',exact:true}).getAttribute('aria-pressed'),'true');
  // Reduced motion: no entrance, no day playback; motion allowed: both run and Play a day can pause.
  await tab('Motion').click(); assert.ok(await lab.getByRole('button',{name:/Play a day/}).isDisabled());
  assert.equal(await canvas.evaluate(el=>el.getAnimations({subtree:true}).length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await lab.getByRole('button',{name:/Play a day/}).click(); await page.waitForTimeout(1200);
  await lab.getByRole('button',{name:/Pause/}).click();
  assert.doesNotMatch(await readout.textContent(),/^Live/,'Play a day moves the clock');
  await lab.getByRole('button',{name:/^Live/}).click();
  // Letters near the pointer swell, then settle back.
  const letter=await lab.locator('.composition-letter').nth(1).boundingBox();
  await page.mouse.move(letter.x+letter.width/2,letter.y+letter.height/2,{steps:4}); await page.waitForTimeout(500);
  const weights=await lab.locator('.composition-letter').evaluateAll(els=>els.map(el=>Number(getComputedStyle(el).fontWeight)));
  assert.ok(weights[1]>700&&weights[6]<600,'Letters near the pointer swell');
  await page.mouse.move(5,5); await page.waitForTimeout(900);
  assert.ok((await lab.locator('.composition-letter').evaluateAll(els=>els.every(el=>!el.style.fontWeight))),'Letters settle back');
  await page.evaluate(()=>document.activeElement?.blur());
  await page.locator('#playground').screenshot({path:'.preview/playground-desktop.png'});
  // Without WebGL the SVG poster stands in, and dragging the sun keeps it under the pointer along its real path.
  const svg=await flat.newPage({viewport:{width:1440,height:1000}}); svg.on('pageerror',e=>errors.push(e.message));
  await svg.clock.setFixedTime(afternoon); await svg.goto(base,{waitUntil:'networkidle'});
  assert.equal(await svg.locator('svg.composition-sky').count(),1,'SVG fallback');
  await svg.locator('.composition-canvas').scrollIntoViewIfNeeded(); await svg.waitForTimeout(1200);
  const sun=await sunCentre(svg); await svg.mouse.move(sun.x,sun.y); await svg.mouse.down();
  for(let i=1;i<=3;i++)await svg.mouse.move(sun.x+i*20,sun.y,{steps:2});
  const moved=await sunCentre(svg); await svg.mouse.up();
  assert.ok(Math.abs(moved.x-sun.x-60)<3&&moved.y>sun.y,'The sun follows the pointer and sinks toward evening');
  // Weather preview in development: rain is named in the readout and printed by the shader.
  const wet=await browser.newPage({viewport:{width:1440,height:1000}}); wet.on('pageerror',e=>errors.push(e.message));
  await wet.clock.setFixedTime(afternoon); await wet.goto(`${base}/?weather=rain`,{waitUntil:'networkidle'});
  assert.match(await wet.locator('.composition-readout').textContent(),/rain$/i);
  await wet.locator('.composition-stage').scrollIntoViewIfNeeded(); await wet.waitForTimeout(400);
  await wet.locator('.composition-stage').screenshot({path:'.preview/playground-rain.png'});
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});touch.on('pageerror',e=>errors.push(e.message));
  await touch.clock.setFixedTime(afternoon); await touch.goto(base,{waitUntil:'networkidle'});
  await touch.getByRole('tab',{name:/Color/}).tap();await touch.getByRole('button',{name:'Terracotta',exact:true}).tap();
  assert.equal(await touch.locator('.composition-canvas').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(239, 223, 208)');
  await touch.waitForTimeout(1300); await touch.evaluate(()=>document.activeElement?.blur());
  await touch.locator('#playground').screenshot({path:'.preview/playground-mobile-color.png'});
  await touch.getByRole('button',{name:'Reset',exact:true}).tap();await touch.getByRole('tab',{name:/Motion/}).tap();await touch.evaluate(()=>document.activeElement?.blur());
  await touch.locator('#playground').screenshot({path:'.preview/playground-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: live print, all modes, time travel, sun drag, reactive type, weather, reset, keyboard, touch and reduced motion.');
 }finally{await browser.close();await flat.close()}
})().catch(e=>{console.error(e);process.exit(1)});
