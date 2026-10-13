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
  assert.equal(await section.getByRole('tablist').getAttribute('aria-orientation'),'vertical');
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
  assert.match((await jsLines())[0],/TK Industrial.*Smashouse.*El Sótano Cómico/);
  assert.equal((await jsLines())[1],'›6 matching projects');
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
  await js.getByRole('button',{name:'Form check',exact:true}).click();
  await editor.fill((await editor.inputValue()).replace('ana@example.com','invalid'));
  await js.locator('.lab-run').click();
  await page.waitForFunction(()=>document.querySelector('#learning-panel-javascript .lab-line.is-log')?.textContent.includes('Check your email'));
  await js.getByRole('button',{name:'Reset code',exact:true}).click();
  assert.match(await editor.inputValue(),/ana@example.com/);

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
  await sql.getByLabel('Build a search query').fill('allende');
  await sql.getByRole('button',{name:'Find projects',exact:true}).click();
  assert.equal((await rows()).length,2);
  const queryDownload=page.waitForEvent('download');
  await sql.getByRole('button',{name:'Export results',exact:true}).click();
  assert.equal((await queryDownload).suggestedFilename(),'project-query.csv');
  await sql.locator('textarea').fill('SELECT name FROM projects LIMIT 1');
  assert.equal(await sql.getByRole('button',{name:'Export results',exact:true}).isDisabled(),true,'Edited queries cannot export stale results');
  await sql.getByLabel('Build a search query').fill("nobody's-project");
  await sql.getByRole('button',{name:'Find projects',exact:true}).click();
  assert.match(await sql.locator('.lab-results').textContent(),/No rows match/);
  await sql.getByRole('button',{name:'Live sites',exact:true}).click();await sql.locator('.lab-run').click();
  await section.screenshot({path:'.preview/learning-sql-1440.png',animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});

  // React: combined filters, empty states, saves, and persistence while switching tabs.
  await tab('react').click();const react=panel('react');
  await react.getByLabel('Find a project').fill('Allende');
  assert.equal(await react.locator('.project-finder-list li').count(),2);
  await react.getByLabel('Show',{exact:true}).selectOption('live');
  assert.equal(await react.locator('.project-finder-list li').count(),1);
  await react.getByRole('button',{name:'Save Propiedades Allende',exact:true}).click();
  assert.match(await react.locator('.component-readout').textContent(),/saved: 1/);
  await tab('code').click();await tab('react').click();
  assert.equal(await react.getByRole('button',{name:'Unsave Propiedades Allende',exact:true}).getAttribute('aria-pressed'),'true');
  await react.getByRole('button',{name:'Saved (1)',exact:true}).click();
  await react.getByRole('button',{name:'Unsave Propiedades Allende',exact:true}).click();
  assert.match(await react.locator('.task-empty').textContent(),/No saved projects/);
  await react.getByRole('button',{name:'Reset demo',exact:true}).click();
  assert.equal(await react.locator('.project-finder-list li').count(),8);
  await section.screenshot({path:'.preview/learning-react-1440.png',animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});

  // Python study: changes input, numbers collisions, exports a real CSV, and invalidates stale output.
  await tab('code').click();const python=panel('code');
  await python.getByLabel('Filenames',{exact:false}).fill('Hero.JPG\nhero.jpg\nPricing.pdf');
  await python.getByRole('button',{name:'Prepare assets',exact:false}).click();
  assert.deepEqual(await python.locator('.asset-result code').allTextContents(),['images/hero.jpg','images/hero-2.jpg','documents/pricing.pdf']);
  const assetDownload=page.waitForEvent('download');
  await python.getByRole('button',{name:'Download mapping',exact:true}).click();
  const assetFile=await assetDownload;assert.equal(assetFile.suggestedFilename(),'asset-mapping.csv');
  const contents=require('node:fs').readFileSync(await assetFile.path(),'utf8');
  assert.match(contents,/"hero.jpg","images\/hero-2.jpg"/);
  await python.getByLabel('Group by type',{exact:true}).uncheck();
  assert.equal(await python.getByRole('button',{name:'Download mapping',exact:true}).isDisabled(),true);
  await python.getByRole('button',{name:'Prepare assets',exact:false}).click();
  assert.equal(await python.locator('.asset-result code').first().textContent(),'hero.jpg');
  await python.getByLabel('Filenames',{exact:false}).fill('');
  await python.getByRole('button',{name:'Prepare assets',exact:false}).click();
  assert.match(await python.locator('.task-status').textContent(),/at least one filename/);
  await python.getByRole('button',{name:'Reset demo',exact:true}).click();
  await python.getByRole('button',{name:'Prepare assets',exact:false}).click();
  await section.screenshot({path:'.preview/learning-python-1440.png',animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});

  // AWS study: stale version, invalidation, cached availability, failure, and recovery.
  await tab('cloud').click();const aws=panel('cloud'),status=()=>aws.locator('.task-status').textContent();
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/Cache miss/);
  await aws.getByRole('button',{name:'Publish v2',exact:true}).click();
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/visitor sees version 1.*S3 has version 2/);
  await aws.getByRole('button',{name:'Clear cache',exact:true}).click();
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/fetched version 2/);
  await aws.getByLabel('Simulate origin outage').check();
  assert.equal(await aws.getByRole('button',{name:'Publish v3',exact:true}).isDisabled(),true);
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/Cache hit/);
  await aws.getByRole('button',{name:'Clear cache',exact:true}).click();
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/Request failed/);
  await aws.getByLabel('Simulate origin outage').uncheck();
  await aws.getByRole('button',{name:/Visit page/}).click();assert.match(await status(),/fetched version 2/);
  await section.screenshot({path:'.preview/learning-aws-1440.png',animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});
  await aws.getByRole('button',{name:'Reset demo',exact:true}).click();assert.match(await aws.locator('.delivery-readout').textContent(),/^0 visits/);
  await page.close();

  // Phone: shorter, no sideways page scroll, Run gets its own row.
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(`${base}/#learning`,{waitUntil:'networkidle'});
  const phoneHeight=await phone.evaluate(()=>Math.round(document.querySelector('#learning').getBoundingClientRect().height));
  assert.ok(phoneHeight<2000,`Section on a phone is ${phoneHeight}px (was 4752px)`);
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No sideways page scroll on a phone');
  assert.equal(await phone.getByRole('tablist',{name:'What I’m learning'}).getAttribute('aria-orientation'),'horizontal');
  await phone.locator('#learning-tab-data').tap();
  await phone.waitForTimeout(400);
  const tabShown=await phone.evaluate(()=>{const row=document.querySelector('.learning-index').getBoundingClientRect(),tab=document.querySelector('#learning-tab-data').getBoundingClientRect();return tab.left>=row.left-1&&tab.right<=row.right+1;});
  assert.ok(tabShown,'A tapped topic slides fully into view in the sideways row');
  const runRow=await phone.locator('#learning-panel-data').evaluate(el=>{const a=el.querySelector('.lab-actions').getBoundingClientRect(),r=el.querySelector('.lab-run').getBoundingClientRect();return Math.abs(a.width-r.width)<2;});
  assert.ok(runRow,'Run query gets the full width on a phone');
  await phone.locator('#learning-panel-data .lab-run').tap();
  assert.equal(await phone.locator('#learning-panel-data .lab-table tbody tr').count(),6);
  await phone.locator('#learning').screenshot({path:'.preview/learning-sql-390.png',animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});
  for(const width of [1024,768,390,320]) {
   await phone.setViewportSize({width,height:900});
   for(const theme of ['javascript','react','data','code','cloud']) {
    await phone.locator(`#learning-tab-${theme}`).click();
    const bounds=await phone.locator(`#learning-panel-${theme}`).evaluate(el=>({pageOverflow:document.documentElement.scrollWidth-innerWidth,panelOverflow:el.scrollWidth-el.clientWidth}));
    assert.ok(bounds.pageOverflow<=1&&bounds.panelOverflow<=1,`${theme} at ${width}px: ${JSON.stringify(bounds)}`);
    if(width===390&&theme==='react') assert.equal(await phone.locator('.react-lab input[type="search"]').evaluate(el=>getComputedStyle(el).fontSize),'16px','Mobile inputs remain readable without iOS focus zoom');
    if(width===390||width===1024) await phone.locator('#learning').screenshot({path:`.preview/learning-${theme}-${width}.png`,animations:'disabled',style:'.studio-skip:not(:focus){visibility:hidden}'});
   }
  }
  await phone.close();

  // Reduced motion: no panel animation.
  const still=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await still.goto(`${base}/#learning`,{waitUntil:'networkidle'});
  assert.equal(await still.locator('#learning-panel-javascript').evaluate(el=>getComputedStyle(el).animationName),'none');
  await still.close();

  assert.deepEqual(errors,[]);
  console.log(`PASS: initial section ${desktopHeight}px desktop / ${phoneHeight}px phone; keyboard tabs; editable JavaScript and timeout; SQL search/export; React filters/shortlist; filename preparation/download; cloud caching/outage/recovery; all five tabs at 1024, 768, 390 and 320px; reduced motion; no console errors.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
