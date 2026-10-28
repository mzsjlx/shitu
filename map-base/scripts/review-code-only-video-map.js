async page=>{
 const base='http://127.0.0.1:8791',browser=page.context().browser(),manifest=await(await page.request.get(base+'/data/video-posters.json')).json(),catalog=await(await page.request.get(base+'/data/video-library.json')).json();
 const count=new Set(catalog.sources.flatMap(s=>s.segments).filter(s=>s.coordinates).map(s=>s.placeId||s.id)).size;
 const assets={schemaVersion:1,segments:Object.fromEntries(Object.entries(manifest.segments).map(([id,s])=>[id,{poster:'./'+s.path}]))};
 const ctx=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),p=await ctx.newPage(),requests=[],errors=[],checks=[],check=(name,passed)=>checks.push({name,passed:!!passed});
 await ctx.route('**/data/video-library-assets.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(assets)}));p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});
  await p.waitForFunction(count=>[...document.querySelectorAll('.food-photo img')].length===count&&[...document.querySelectorAll('.food-photo img')].filter(i=>{const r=i.getBoundingClientRect();return r.right>0&&r.left<innerWidth&&r.bottom>64&&r.top<innerHeight;}).every(i=>i.complete&&i.naturalWidth>0),count,{timeout:12000});
  check('Code-only checkout displays every located shop with a real thumbnail',true);check('No MP4 is requested without imported packages',!requests.some(u=>u.endsWith('.mp4')));
  await p.evaluate(()=>window.foodCityMap.food.focusStops('video-tiedan-gangzi'));await p.locator('[data-food-id="video-tiedan-gangzi"] .food-open').click({timeout:7000});
  check('Popup retains a decodable food cover and missing-package note',await p.locator('.food-popover-media img').evaluate(i=>i.complete&&i.naturalWidth>0)&&(await p.locator('.food-inline-popover').innerText()).includes('视频待同步'));
  await p.locator('.food-popover-clip').filter({hasText:'白龙'}).click();await p.waitForFunction(()=>{const i=document.querySelector('.food-popover-media img');return i?.src.includes('bailong-gangzi')&&i.complete&&i.naturalWidth>0;});check('Code-only same-shop switch displays the other creator’s real cover',await p.locator('.food-popover-play').count()===0);
  await p.setViewportSize({width:390,height:844});check('Mobile code-only map still opens its inline popup',await p.locator('.food-inline-popover').isVisible());
 }catch(error){check('Code-only flow completes',false);errors.push(error.message);}finally{await ctx.close()}
 check('No browser errors',errors.length===0);return {date:'2026-10-28',checks,errors,passed:checks.every(c=>c.passed)};
}
