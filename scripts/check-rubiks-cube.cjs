const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.PORTFOLIO_URL||'http://127.0.0.1:5173';
// Full cycle: 14*(220+90) scramble + 550 pause + 14*(160+60) solve = 7970ms.
const CYCLE_MS=7970;

// Runs in the page. Using only what the browser actually computed (not the cube's own model), finds any
// piece whose outside faces aren't all colored stickers — i.e. black plastic showing on the outside.
function installWatchers(){
 const plastic='rgb(23, 24, 15)';
 const directionOf=(matrix)=>{const p=matrix.transformPoint(new DOMPoint(0,0,1,0));return [p.x,p.y,p.z].map(Math.round).join();};
 window.__plasticProblems=()=>{
  const problems=[];
  for(const cubie of document.querySelectorAll('.rubiks-cubies > .rubiks-cubie')){
   const m=new DOMMatrixReadOnly(getComputedStyle(cubie).transform);
   const outward=[m.m41,m.m42,m.m43].flatMap((v,i)=>Math.abs(v)<1?[]:[[0,1,2].map(k=>k===i?Math.sign(v):0).join()]).sort();
   const stickers=[...cubie.children].filter(face=>getComputedStyle(face).backgroundColor!==plastic).map(face=>directionOf(m.multiply(new DOMMatrixReadOnly(getComputedStyle(face).transform)))).sort();
   if(stickers.join('|')!==outward.join('|'))problems.push(`outside [${outward.join(' ')}] but stickers face [${stickers.join(' ')}]`);
  }
  return problems;
 };
 // Watches every turn: how long its spinning layer lived and how far it turned; and checks for plastic
 // every time the cube is between turns (no layer spinning).
 window.__turns=[];window.__restProblems=[];window.__restChecks=0;
 let current=null;
 const angleOf=el=>{const m=new DOMMatrixReadOnly(getComputedStyle(el).transform);return Math.round(Math.acos(Math.max(-1,Math.min(1,(m.m11+m.m22+m.m33-1)/2)))*180/Math.PI);};
 (function watch(now){
  const layer=document.querySelector('.rubiks-turn-layer');
  if(layer&&current&&current.el!==layer){window.__turns.push({ms:Math.round(now-current.start),angle:current.angle});current=null;}
  if(layer&&!current)current={el:layer,start:now,angle:0};
  if(layer)current.angle=Math.max(current.angle,angleOf(layer));
  if(!layer&&current){window.__turns.push({ms:Math.round(now-current.start),angle:current.angle});current=null;}
  if(!layer&&document.querySelector('.rubiks-trigger').getAttribute('aria-disabled')==='true'){window.__restChecks++;window.__restProblems.push(...window.__plasticProblems());}
  requestAnimationFrame(watch);
 })(performance.now());
}

(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${base}/#about`,{waitUntil:'networkidle'});
  const trigger=page.locator('.rubiks-trigger');
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.evaluate(installWatchers);
  assert.equal(await page.locator('.rubiks-cubie').count(),26,'A real cube has 26 small cubes you can see');
  assert.deepEqual(await page.evaluate(()=>window.__plasticProblems()),[],'Solved cube shows no plastic outside');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-solved.png'});

  // One full click: scramble, pause, solve.
  await trigger.click();
  await page.waitForTimeout(500);
  assert.equal(await trigger.getAttribute('aria-disabled'),'true','Marked busy while it shuffles');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-scrambling.png'});
  await trigger.click({force:true}); // lands while busy (Playwright would otherwise wait for aria-disabled to clear): must be ignored, focus kept
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('rubiks-trigger')),true,'Keyboard focus stays on the cube while it is busy');
  await page.waitForTimeout(CYCLE_MS+900);

  const run=await page.evaluate(()=>({turns:window.__turns,restChecks:window.__restChecks,restProblems:window.__restProblems}));
  const short=run.turns.filter(t=>t.angle<80||t.ms<120);
  console.log(`turns: ${run.turns.length} | cut short: ${short.length} | at-rest plastic checks: ${run.restChecks}, problems: ${run.restProblems.length}`);
  assert.equal(run.turns.length,28,'All 14 scramble turns and 14 solve turns animate');
  assert.deepEqual(short,[],'Every turn spins the full quarter-turn, none cut short or skipped');
  assert.ok(run.restChecks>20,'Plastic check actually ran between turns');
  assert.deepEqual([...new Set(run.restProblems)],[],'No black plastic on the outside at any point between turns');

  const settled=await page.evaluate(()=>({busy:document.querySelector('.rubiks-trigger').getAttribute('aria-disabled'),status:document.querySelector('.rubiks-announcement').textContent,turning:document.querySelectorAll('.rubiks-turn-layer').length,cubies:document.querySelectorAll('.rubiks-cubie').length,problems:window.__plasticProblems(),longest:Math.max(...[...document.querySelectorAll('.rubiks-cubie')].map(c=>c.getAttribute('style').length))}));
  assert.equal(settled.busy,'false','Clickable again once it is done');
  assert.equal(settled.status,'Solved.','Announces when it is done, for screen readers');
  assert.equal(settled.turning,0,'No turn left mid-animation');
  assert.equal(settled.cubies,26,'Still all 26 cubes after a full cycle');
  assert.deepEqual(settled.problems,[],'Solved again, no plastic outside');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-solved-again.png'});

  // Click again: a genuinely different scramble. And a piece's CSS stays the same small size, however many clicks.
  const before=await page.locator('.rubiks-cubies').innerHTML();
  await trigger.click();
  await page.waitForTimeout(500);
  assert.notEqual(await page.locator('.rubiks-cubies').innerHTML(),before,'Shuffles differently on a second click');
  await page.waitForTimeout(CYCLE_MS+900);
  const longestAfter=await page.evaluate(()=>Math.max(...[...document.querySelectorAll('.rubiks-cubie')].map(c=>c.getAttribute('style').length)));
  assert.ok(longestAfter<=settled.longest+10,`Piece CSS doesn't grow with clicks (${settled.longest} -> ${longestAfter} chars)`);

  // Small screens: still fits inside the section, no overflow.
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(200);
  await trigger.scrollIntoViewIfNeeded();
  const cubeBox=await trigger.boundingBox(),sectionBox=await page.locator('.studio-about').boundingBox();
  assert.ok(cubeBox.x>=sectionBox.x-1&&cubeBox.x+cubeBox.width<=sectionBox.x+sectionBox.width+1,'Stays inside the section on a phone');
  await page.locator('.studio-about').screenshot({path:'.preview/rubiks-mobile.png'});
  await page.close();

  // Reduced motion: jumps straight to scrambled and back, no spinning — and the scrambled state is a valid cube.
  const reduced=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  reduced.on('pageerror',e=>errors.push(e.message));
  await reduced.goto(`${base}/#about`,{waitUntil:'networkidle'});
  await reduced.evaluate(installWatchers);
  const reducedTrigger=reduced.locator('.rubiks-trigger');
  await reducedTrigger.scrollIntoViewIfNeeded();
  await reducedTrigger.click();
  await reduced.waitForTimeout(150);
  assert.equal(await reduced.evaluate(()=>document.querySelectorAll('.rubiks-turn-layer').length),0,'No spinning layer when motion is reduced');
  assert.deepEqual(await reduced.evaluate(()=>window.__plasticProblems()),[],'The scrambled state shows no plastic outside');
  await reduced.locator('.studio-about').screenshot({path:'.preview/rubiks-reduced-scrambled.png'});
  await reduced.waitForTimeout(800);
  assert.equal(await reducedTrigger.getAttribute('aria-disabled'),'false','Finishes and frees up under reduced motion too');
  await reduced.close();

  assert.deepEqual(errors,[]);
  console.log('PASS: 26 cubes, all 28 turns spin fully, no plastic outside at any rest point, exact solved state, steady CSS size, focus kept while busy, phone layout, reduced motion, no console errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
