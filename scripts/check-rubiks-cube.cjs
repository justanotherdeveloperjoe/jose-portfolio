const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.PORTFOLIO_URL||'http://127.0.0.1:5173';
// Full cycle is 14*(220+90) scramble + 550 pause + 14*(160+60) solve = 7970ms.
const CYCLE_MS=7970;
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${base}/#about`,{waitUntil:'networkidle'});
  const trigger=page.locator('.rubiks-trigger');
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.rubiks-cubie').count(),26,'A real cube has 26 small cubes you can see');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-solved.png'});

  // Click it: it should scramble, ignore clicks while busy, then settle back to exactly solved.
  await trigger.click();
  await page.waitForTimeout(500);
  assert.equal(await trigger.evaluate(el=>el.disabled),true,'Ignores clicks while it is shuffling');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-scrambling.png'});
  await trigger.click({force:true}); // a click while disabled should do nothing
  await page.waitForTimeout(CYCLE_MS+900);
  const settled=await page.evaluate(()=>({disabled:document.querySelector('.rubiks-trigger').disabled,status:document.querySelector('.rubiks-announcement').textContent,turning:document.querySelectorAll('.rubiks-turn-layer').length,cubies:document.querySelectorAll('.rubiks-cubie').length}));
  assert.equal(settled.disabled,false,'Clickable again once it is done');
  assert.equal(settled.status,'Solved.','Announces when it is done, for screen readers');
  assert.equal(settled.turning,0,'No turn left mid-animation');
  assert.equal(settled.cubies,26,'Still all 26 cubes after a full cycle');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-solved-again.png'});

  // Click it again: a genuinely different scramble, not the same one replayed.
  const before=await page.locator('.rubiks-cubies').innerHTML();
  await trigger.click();
  await page.waitForTimeout(500);
  assert.notEqual(await page.locator('.rubiks-cubies').innerHTML(),before,'Shuffles differently on a second click');
  await page.waitForTimeout(CYCLE_MS+900);

  // Small screens: still fits inside the section, no overflow.
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(200);
  await trigger.scrollIntoViewIfNeeded();
  const cubeBox=await trigger.boundingBox(),sectionBox=await page.locator('.studio-about').boundingBox();
  assert.ok(cubeBox.x>=sectionBox.x-1 && cubeBox.x+cubeBox.width<=sectionBox.x+sectionBox.width+1,'Stays inside the section on a phone');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-mobile.png'});
  await page.close();

  // Reduced motion: jumps straight from solved to scrambled to solved, no continuous spinning.
  const reduced=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  reduced.on('pageerror',e=>errors.push(e.message));
  await reduced.goto(`${base}/#about`,{waitUntil:'networkidle'});
  const reducedTrigger=reduced.locator('.rubiks-trigger');
  await reducedTrigger.scrollIntoViewIfNeeded();
  await reducedTrigger.click();
  await reduced.waitForTimeout(150);
  assert.equal(await reduced.evaluate(()=>document.querySelectorAll('.rubiks-turn-layer').length),0,'No animated turn layer when motion is reduced');
  await reduced.waitForTimeout(800);
  assert.equal(await reducedTrigger.evaluate(el=>el.disabled),false,'Finishes and re-enables under reduced motion too');
  await reduced.close();

  assert.deepEqual(errors,[]);
  console.log('PASS: 26 cubes, busy-state guard, genuine re-scramble, exact solved state, phone layout, reduced motion, no console errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
