async page=>{
 const base='http://127.0.0.1:8791',root='D:/codex/美食网站/',browser=page.context().browser();
 const report={date:'2026-10-27',scope:'Isolated Chromium; video-to-reference-area navigation, media shutdown, source attribution, known location boundaries, responsive layout, mode changes and nested dialogs. Landmark reference only; no shop coordinates verified.',checks:[],errors:[],external:[]};
 const check=(name,passed,details)=>report.checks.push({name,passed:!!passed,details});
 async function run(name,body){const c=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});await c.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async r=>{report.external.push(r.request().url());await r.abort();});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));try{await body(p,c);}catch(error){check(name+' completes',false,error.message);await p.screenshot({path:root+'output/playwright/video-neighborhood-failure.png'}).catch(()=>{});}finally{await c.close();}}
 const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap?.food?.active,undefined,{timeout:30000});
 const settle=p=>p.waitForFunction(()=>!window.foodCityMap.map.isMoving());
 const openClip=async p=>{await p.goto(base+'/?view=food&videos=1&clip=nangua-sanyangzi');await ready(p);await p.waitForFunction(()=>document.querySelector('#video-library-player h3')?.textContent==='三样子');};
 const nearby=async p=>{await p.locator('.video-nearby-button').click();await p.waitForFunction(()=>!document.getElementById('video-library-dialog').open&&window.foodCityMap.videoContext.active?.segmentId==='nangua-sanyangzi');await settle(p);};
 await run('Reference navigation',async p=>{
   const mediaRequests=[];p.on('request',r=>{if(r.url().endsWith('.mp4'))mediaRequests.push(r.url());});await openClip(p);
   check('Deep link selects the requested clip without loading another shop video',mediaRequests.length>0&&mediaRequests.every(u=>u.includes('nangua-sanyangzi-')),mediaRequests);
   check('Review keeps the original address and a clearly named nearby action',await p.locator('.video-nearby-button').textContent()==='看看罗汉寺附近 ↗'&&(await p.locator('.video-player-address').textContent()).includes('罗汉寺妙街L1-6'));
   await p.locator('.video-address-review summary').click();const review=await p.locator('.video-address-review').innerText();check('Address review exposes unresolved alternatives and their sources',review.includes('新华路105号')&&review.includes('观音桥')&&await p.locator('.video-address-review a').count()===4);
   const safe=await p.locator('.video-address-review a').evaluateAll(es=>es.every(e=>e.protocol==='https:'&&e.target==='_blank'&&e.rel.includes('noopener')&&e.rel.includes('noreferrer')));check('Review sources have safe explicit outbound links',safe);
   await p.locator('#video-library-player video').evaluate(async v=>{window.__oldReferenceVideo=v;await v.play();});await nearby(p);
   check('Map navigation stops and unloads the playing clip',await p.evaluate(()=>window.__oldReferenceVideo.paused&&!window.__oldReferenceVideo.getAttribute('src')));
   check('Nearby view exposes no open modal and gives keyboard focus to return',await p.locator('dialog[open]').count()===0&&await p.locator('#video-map-back').evaluate(e=>e===document.activeElement));
   const state=await p.evaluate(()=>({active:window.foodCityMap.videoContext.active,features:window.foodCityMap.map.getSource('video-place-reference').serialize().data.features,food:window.foodCityMap.getStats().foodCards,note:document.getElementById('video-map-note').innerText}));
   check('Map highlights a polygon with reference-only flags and keeps two original shop pins',state.active.shopLocated===false&&state.features.length===1&&state.features[0].geometry.type==='Polygon'&&state.features[0].properties.referenceOnly===true&&state.food===2,state);
   check('Map note names the real reference landmark and keeps branch status pending',state.note.includes('浅色轮廓为罗汉寺')&&state.note.includes('分店位置待核')&&await p.locator('#video-map-source').getAttribute('href')==='https://www.openstreetmap.org/way/412612157');
   for(const [width,height]of [[1440,960],[390,844],[320,680],[736,414]]){
     await p.setViewportSize({width,height});if(width!==1440){await p.locator('#video-map-back').click();await p.locator('.video-nearby-button').click();await settle(p);}
     const geometry=await p.locator('#video-map-note').evaluate(e=>{const r=e.getBoundingClientRect();return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
     check('Reference note and actions fit '+width+'×'+height,geometry.scroll===width&&geometry.left>=0&&geometry.right<=width&&geometry.top>=0&&geometry.bottom<=height,geometry);
     const mapState=await p.evaluate(()=>{const map=window.foodCityMap.map;return {center:map.getCenter().toArray(),zoom:map.getZoom(),pitch:map.getPitch()};});
     check('Nearby camera stays around the named landmark at '+width,mapState.center[0]>106.573&&mapState.center[0]<106.583&&mapState.center[1]>29.558&&mapState.center[1]<29.567,mapState);
     if(width===1440||width===390)await p.screenshot({path:root+'output/playwright/video-neighborhood-'+width+'.png'});
     await p.locator('#video-map-back').click();check('Return reopens the same store clip at '+width,await p.locator('#video-library-player h3').textContent()==='三样子');
     await p.waitForFunction(()=>document.querySelector('#video-library-player video')?.readyState>=2);check('Returned clip decodes without autoplay at '+width,await p.locator('#video-library-player video').evaluate(v=>v.paused&&v.videoWidth===576&&Math.abs(v.duration-13.966)<.1));
     await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('video-library-dialog').open);
   }
   await p.setViewportSize({width:1440,height:960});await p.locator('#video-map-close').click();
   check('Close removes reference data, note and mode without changing shop pins',await p.evaluate(()=>!window.foodCityMap.videoContext.active&&document.getElementById('video-map-note').hidden&&window.foodCityMap.map.getSource('video-place-reference').serialize().data.features.length===0&&window.foodCityMap.getStats().foodCards===2));
   await p.locator('#food-pick-open').click();await p.locator('#video-library-open').click();await p.locator('[data-clip="nangua-sanyangzi"]').click();await nearby(p);
   check('Starting from the food picker closes both dialogs before showing map',await p.locator('dialog[open]').count()===0);
   await p.locator('#reset-view').click();await settle(p);check('City reset clears the reference layer',await p.evaluate(()=>!window.foodCityMap.videoContext.active&&window.foodCityMap.map.getLayoutProperty('video-place-reference-fill','visibility')==='none'));
   await p.locator('#food-pick-open').click();await p.locator('#video-library-open').click();await p.locator('[data-clip="nangua-jeju"]').click();check('Unrelated or unresolved shop gets no borrowed nearby location',await p.locator('.video-nearby-button').count()===0);
 });
 await run('Mode transitions and standalone',async p=>{
   await openClip(p);await nearby(p);await p.locator('#view-2d').click();check('Switching map mode clears stale reference',await p.evaluate(()=>window.foodCityMap.videoContext.active===null));
   await p.locator('#food-pick-open').click();await p.locator('#video-library-open').click();await p.locator('[data-clip="nangua-sanyangzi"]').click();await nearby(p);check('Nearby view respects a selected 2D map',await p.evaluate(()=>window.foodCityMap.map.getPitch()===0));
   await p.locator('#layers-toggle').click();await p.locator('#landmark-entry').click();check('Hongyadong focus clears the reference without stealing that view',await p.evaluate(()=>!window.foodCityMap.videoContext.active&&!document.getElementById('landmark-note').hidden));
   await p.goto(base+'/preview.html?view=food&videos=1&clip=nangua-sanyangzi');await ready(p);await p.waitForFunction(()=>document.querySelector('#video-library-player h3')?.textContent==='三样子');await nearby(p);check('HTTP standalone supports the same reference with source attribution',await p.locator('#video-map-source').getAttribute('href')==='https://www.openstreetmap.org/way/412612157');
 });
 await run('Slow map feedback',async(p,c)=>{
   await c.route('**/data/chongqing.pmtiles',r=>r.abort());await p.goto(base+'/?view=food&videos=1&clip=nangua-sanyangzi');await p.waitForFunction(()=>document.querySelector('#video-library-player h3')?.textContent==='三样子');await p.locator('.video-nearby-button').click();
   check('A map that is not ready leaves the clip open with an actionable message',await p.locator('#video-library-dialog').evaluate(d=>d.open)&&(await p.locator('.video-context-error').textContent()).includes('地图还在展开')&&await p.locator('#video-map-note').isHidden());
 });
 check('No uncaught page errors',report.errors.length===0,report.errors);check('No automatic third-party requests',report.external.length===0,report.external);report.passed=report.checks.every(c=>c.passed);return report;
}
