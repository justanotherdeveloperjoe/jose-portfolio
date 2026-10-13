const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.PORTFOLIO_URL||'http://127.0.0.1:5173';
(async()=>{
 const browser=await chromium.launch();
 try{
  const errors=[];
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${base}/#learning`,{waitUntil:'networkidle'});
  const section=page.locator('#learning');
  await section.scrollIntoViewIfNeeded();
  const height=async()=>page.evaluate(()=>Math.round(document.querySelector('#learning').getBoundingClientRect().height));
  const desktopHeight=await height();
  assert.ok(desktopHeight<1200,`Section is about one screen on desktop (${desktopHeight}px, was 2236px)`);

  // Tabs: five topics, arrow keys move between them (and focus follows), one panel visible at a time.
  const tab=theme=>page.locator(`#learning-tab-${theme}`), panel=theme=>page.locator(`#learning-panel-${theme}`);
  assert.equal(await section.getByRole('tab').count(),5);
  assert.equal(await tab('javascript').getAttribute('aria-selected'),'true');
  await tab('javascript').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await tab('react').getAttribute('aria-selected'),'true');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'learning-tab-react');
  assert.ok(await panel('react').isVisible()&&!(await panel('javascript').isVisible()),'Only the chosen panel shows');
  await page.keyboard.press('End');assert.equal(await tab('cloud').getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowDown');assert.equal(await tab('javascript').getAttribute('aria-selected'),'true','Wraps around');
  await page.keyboard.press('Home');assert.equal(await tab('javascript').getAttribute('aria-selected'),'true');

  // JavaScript: the starter really runs, edited code really runs, Ctrl+Enter runs, errors are explained.
  const js=panel('javascript'),jsLines=()=>js.locator('.lab-line').allTextContents();
  await js.locator('.lab-run').click();
  await page.waitForFunction(()=>document.querySelectorAll('#learning-panel-javascript .lab-line.is-log').length===2);
  assert.deepEqual(await jsLines(),["›[ 'LEARN', 'BUILD', 'IMPROVE' ]",'›[ \'improve\' ] 1 of 3']);
  assert.match(await js.locator('.scene-caption').textContent(),/^Ran in \d+ ms · 2 lines of output\.$/);
  const editor=js.locator('textarea');
  await editor.fill('const total = [1, 2, 3].reduce((a, b) => a + b);\nconsole.log("total", total);\nreturn total * 2;');
  await editor.focus();await page.keyboard.press('Control+Enter');
  await page.waitForFunction(()=>document.querySelector('#learning-panel-javascript .lab-line.is-result'));
  assert.deepEqual(await jsLines(),['›total 6','←12']);
  await editor.fill('missing.call();');await js.locator('.lab-run').click();
  await page.waitForFunction(()=>document.querySelector('#learning-panel-javascript .lab-line.is-error'));
  assert.deepEqual(await jsLines(),['✕ReferenceError: missing is not defined']);
  // The editor's two layers line up exactly: same box, same type, same text.
  const layers=await js.evaluate(el=>{const t=el.querySelector('textarea'),p=el.querySelector('.code-colors'),a=t.getBoundingClientRect(),b=p.getBoundingClientRect(),s=getComputedStyle(t),c=getComputedStyle(p);return{dx:Math.abs(a.left-b.left)+Math.abs(a.top-b.top)+Math.abs(a.width-b.width)+Math.abs(a.height-b.height),same:['fontFamily','fontSize','lineHeight','paddingTop','paddingLeft','letterSpacing','whiteSpace','tabSize'].every(k=>s[k]===c[k]),text:p.textContent===t.value+'\n'};});
  assert.ok(layers.dx<1&&layers.same&&layers.text,`Editor layers drift apart: ${JSON.stringify(layers)}`);
  // Edits survive a look at another topic.
  await editor.fill('console.log("kept")');
  await tab('data').click();await tab('javascript').click();
  assert.equal(await editor.inputValue(),'console.log("kept")','Edits are kept when switching topics');

  // The endless loop is stopped after 2 seconds, and the page stays usable the whole time.
  await js.getByRole('button',{name:'Endless loop'}).click();
  const started=Date.now();
  await js.locator('.lab-run').click();
  await page.waitForTimeout(300);
  await tab('react').click();
  assert.equal(await tab('react').getAttribute('aria-selected'),'true','The page responds while the loop runs');
  const ticks=await page.evaluate(()=>new Promise(done=>{let n=0;const t0=performance.now();(function f(){n++;performance.now()-t0<500?requestAnimationFrame(f):done(n);})();}));
  assert.ok(ticks>15,`The page keeps animating during the loop (${ticks} frames in 0.5s)`);
  await page.waitForFunction(()=>document.querySelector('#learning-panel-javascript .lab-line.is-stopped'),null,{timeout:5000});
  const took=Date.now()-started;
  assert.ok(took>1800&&took<3500,`Stopped after about 2 seconds (${took}ms)`);
  assert.match(await js.locator('.scene-caption').textContent(),/Stopped after 2 seconds/);

  // SQL: real answers about the real projects, friendly errors.
  await tab('data').click();
  const sql=panel('data'),rows=()=>sql.locator('.lab-table tbody tr').evaluateAll(trs=>trs.map(tr=>[...tr.cells].map(td=>td.textContent)));
  await sql.locator('.lab-run').click();
  assert.deepEqual((await rows()).map(r=>r[0]),['AFH Logistics','El Sótano Cómico','Ikinuki Trip Agency','Propiedades Allende','Smashouse','TK Industrial']);
  assert.equal(await sql.locator('.lab-results .lab-table-scroll').evaluate(el=>el.parentElement.scrollHeight<=el.parentElement.clientHeight+1),true,'All six rows show without scrolling');
  await sql.getByRole('button',{name:'Count by status'}).click();await sql.locator('.lab-run').click();
  assert.deepEqual(await rows(),[['live','6'],['soon','2']]);
  await sql.getByRole('button',{name:'Search'}).click();await sql.locator('.lab-run').click();
  assert.deepEqual((await rows()).map(r=>r[0]),['Nutrióloga Allende','Wolf Fitness','Propiedades Allende']);
  await sql.locator('textarea').fill('SELECT nme FROM projects');await sql.locator('textarea').press('Control+Enter');
  assert.match(await sql.locator('.lab-line.is-error').textContent(),/no column called "nme"/);
  await sql.locator('textarea').fill('DELETE FROM projects');await sql.locator('.lab-run').click();
  assert.match(await sql.locator('.lab-line.is-error').textContent(),/read-only/);
  await section.screenshot({path:'.preview/learning-lab-1440.png'});

  // The illustrated scenes still work.
  await tab('react').click();await panel('react').getByRole('button',{name:/Change state/}).click();
  assert.match(await panel('react').locator('.scene-caption').textContent(),/State is 1/);
  await tab('code').click();await panel('code').getByRole('button',{name:/Give it a task/}).click();
  assert.match(await panel('code').locator('.scene-caption').textContent(),/3 sample files sorted/);
  await tab('cloud').click();await panel('cloud').getByRole('button',{name:'Rain'}).click();
  assert.match(await panel('cloud').locator('.scene-caption').textContent(),/^Rain in this little cloud world/);
  await page.close();

  // Phone: shorter, no sideways page scroll, Run gets its own row.
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(`${base}/#learning`,{waitUntil:'networkidle'});
  const phoneHeight=await phone.evaluate(()=>Math.round(document.querySelector('#learning').getBoundingClientRect().height));
  assert.ok(phoneHeight<2000,`Section on a phone is ${phoneHeight}px (was 4752px)`);
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No sideways page scroll on a phone');
  await phone.locator('#learning-tab-data').tap();
  await phone.waitForTimeout(400);
  const tabShown=await phone.evaluate(()=>{const row=document.querySelector('.learning-index').getBoundingClientRect(),tab=document.querySelector('#learning-tab-data').getBoundingClientRect();return tab.left>=row.left-1&&tab.right<=row.right+1;});
  assert.ok(tabShown,'A tapped topic slides fully into view in the sideways row');
  const runRow=await phone.locator('#learning-panel-data').evaluate(el=>{const a=el.querySelector('.lab-actions').getBoundingClientRect(),r=el.querySelector('.lab-run').getBoundingClientRect();return Math.abs(a.width-r.width)<2;});
  assert.ok(runRow,'Run query gets the full width on a phone');
  await phone.locator('#learning-panel-data .lab-run').tap();
  assert.equal(await phone.locator('#learning-panel-data .lab-table tbody tr').count(),6);
  await phone.locator('#learning').screenshot({path:'.preview/learning-lab-390.png'});
  await phone.close();

  // Reduced motion: no panel animation.
  const still=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await still.goto(`${base}/#learning`,{waitUntil:'networkidle'});
  assert.equal(await still.locator('#learning-panel-javascript').evaluate(el=>getComputedStyle(el).animationName),'none');
  await still.close();

  assert.deepEqual(errors,[]);
  console.log(`PASS: ${desktopHeight}px on desktop (was 2236), ${phoneHeight}px on a phone (was 4752); keyboard tabs; real JavaScript (edits, Ctrl+Enter, errors, aligned editor, kept edits, endless loop stopped in ~2s with the page responsive); real SQL on the real projects; React, Python and AWS scenes; phone layout; reduced motion; no console errors.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
