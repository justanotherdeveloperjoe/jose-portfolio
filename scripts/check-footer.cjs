const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const b=await chromium.launch();try{
 const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.PORTFOLIO_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});
 const baseline=fs.existsSync('.preview/footer-baseline.json')?JSON.parse(fs.readFileSync('.preview/footer-baseline.json','utf8')):{};
 const clean=s=>s.replace(/ style=""/g,'').replace(/\b\d{2}:\d{2}\b/g,'TIME');
 const mountain=p.locator('.mountain-signature');const light=mountain.locator('radialGradient');
 for(const width of [1440,768,390,320]){
  await p.setViewportSize({width,height:1000});await p.evaluate(()=>document.fonts.ready);
  if(baseline[width])for(const[selector,expected]of Object.entries(baseline[width])){
   if(selector==='#playground')continue; // redesigned since this baseline; scripts/check-playground.cjs covers it
   const actual=await p.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return{html:el.outerHTML,width:r.width,height:r.height}});
   assert.ok(Math.abs(actual.width-expected.width)<1&&Math.abs(actual.height-expected.height)<1,`${selector} dimensions changed at ${width}`);
   if(selector!=='.mountain-signature')assert.equal(clean(actual.html),clean(expected.html),`${selector} markup changed`);
  }
  await p.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:"instant"}));await p.waitForTimeout(100);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await mountain.locator('.mountain-ridge').evaluate(el=>getComputedStyle(el).transform),'none');
  await p.screenshot({path:`.preview/footer-${width}.png`});console.log(`${width}px: layout preserved, no overflow, reduced-motion landscape still.`);
 }
 await p.setViewportSize({width:1440,height:1000});await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(150);await mountain.scrollIntoViewIfNeeded();await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));await p.waitForTimeout(100);
 const bounds=await mountain.boundingBox(), y=bounds.y+bounds.height*.6;
 await p.mouse.move(150,y);await p.waitForTimeout(1100);const left=Number(await light.getAttribute('cx'));
 await p.mouse.move(1280,y);await p.waitForTimeout(1100);const right=Number(await light.getAttribute('cx'));
 assert.ok(right-left>650,'Ridge light follows pointer');
 const positions=await mountain.evaluate(el=>({far:parseFloat(el.style.getPropertyValue('--ridge-x')),near:parseFloat(el.style.getPropertyValue('--foothill-x'))}));
 assert.ok(positions.near>positions.far&&positions.near<=7&&positions.far<=3,'Subtle independent layer depth');
 await p.screenshot({path:'.preview/footer-desktop-active.png'});
 const settled=await mountain.getAttribute('style');await p.waitForTimeout(250);assert.equal(await mountain.getAttribute('style'),settled,'Settles without continuing style updates');
 const cta=p.locator('#contact > a');const headlineBox=await cta.boundingBox();await cta.focus();await p.waitForTimeout(300);
 assert.ok(await cta.evaluate(el=>el.matches(':focus-visible')));assert.equal(await cta.locator('em').evaluate(el=>getComputedStyle(el).color),'rgb(229, 255, 167)');
 assert.equal(await cta.getAttribute('href'),'mailto:devilfruitd3v@proton.me');
 assert.equal((await cta.boundingBox()).x,headlineBox.x,'Headline does not move');
 assert.match(await cta.locator('span').evaluate(el=>getComputedStyle(el).transform),/5, -5/);
 await p.mouse.move(1280,y);await p.waitForTimeout(250);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);
 assert.equal(await light.getAttribute('cx'),'720.00');assert.equal(await mountain.locator('.mountain-ridge').evaluate(el=>getComputedStyle(el).transform),'none');
 await p.mouse.move(150,y);assert.equal(await light.getAttribute('cx'),'720.00');
 await p.emulateMedia({reducedMotion:'no-preference'});await p.mouse.move(1280,y);await p.waitForTimeout(150);await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await p.waitForTimeout(150);
 assert.equal(await light.getAttribute('cx'),'720.00','Offscreen effects reset');
 const touch=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});touch.on('pageerror',e=>errors.push(e.message));
 await touch.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});await touch.evaluate(()=>scrollTo({top:document.body.scrollHeight-1100,behavior:"instant"}));await touch.waitForTimeout(900);
 const touchLight=touch.locator('.mountain-signature radialGradient');const first=Number(await touchLight.getAttribute('cx'));
 await touch.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:"instant"}));await touch.waitForTimeout(1100);const second=Number(await touchLight.getAttribute('cx'));
 assert.ok(Math.abs(second-first)>10,'Touch scroll shifts light');
 assert.ok(Math.abs(await touch.locator('.mountain-signature').evaluate(el=>parseFloat(el.style.getPropertyValue('--foothill-x'))))<3,'Touch depth stays restrained');
 await touch.screenshot({path:'.preview/footer-mobile-active.png'});
 await touch.emulateMedia({reducedMotion:'reduce'});await touch.waitForTimeout(100);assert.equal(await touchLight.getAttribute('cx'),'720.00');
 assert.deepEqual(errors,[]);console.log('PASS: pointer depth and ridge light, idle settling, keyboard CTA, live reduced-motion changes, offscreen reset, touch scroll and unchanged page sections.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
