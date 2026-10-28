async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8791',checks=[],errors=[],contexts=[];
 const check=(name,passed,detail)=>checks.push({name,passed:!!passed,...(detail===undefined?{}:{detail})});
 const pair=['video-nangua-sanyangzi','video-bailong-chunhong'];
 const fresh=async(viewport={width:1440,height:960})=>{const c=await browser.newContext({viewport,reducedMotion:'reduce'});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return p;};
 const ready=async(p,url='/?view=food')=>{await p.goto(base+url);await p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});};
 const select=async(p,ids=pair)=>p.evaluate(ids=>{const f=window.foodCityMap.food;for(const id of ids)if(!f.saved.includes(id))f.toggleSave(id);},ids);
 const done=async p=>p.waitForFunction(()=>['ready','partial','error'].includes(window.foodCityMap.food.routePreview.phase),undefined,{timeout:30000});
 const stats=async p=>p.evaluate(()=>window.foodCityMap.food.routePreview.getStats());
 const sources=async p=>p.evaluate(()=>{const f=window.foodCityMap.food;return {direct:f.map.getSource('food-direct-preview')?._data.geojson.features||[],road:f.map.getSource('food-road-preview')?._data.geojson.features||[],saved:[...f.saved],labels:[...document.querySelectorAll('.food-distance-badge')].map(x=>x.textContent),caption:document.getElementById('trip-dock-caption').textContent};});
 try{
  const p=await fresh(),requests=[];p.on('request',r=>{if(/food-road-(network|worker)/.test(r.url()))requests.push(r.url());});
  await p.goto(base+'/');await p.waitForFunction(()=>window.foodCityMap?.food,undefined,{timeout:30000});
  check('Ordinary map does not load the road network or worker',requests.length===0);
  await p.evaluate(()=>window.foodCityMap.food.activate());await select(p);const direct=await stats(p),directSources=await sources(p);
  check('Direct mode is lazy and retains one two-point dashed line',requests.length===0&&direct.mode==='direct'&&direct.count===1&&directSources.direct[0].geometry.coordinates.length===2&&directSources.labels[0].includes('直线'));
  await p.locator('[data-route-mode="road"]').click();await done(p);const road=await stats(p),roadSources=await sources(p);
  check('Road mode follows many original road coordinates and changes the distance',road.phase==='ready'&&road.count===1&&road.total>direct.total&&roadSources.road.find(f=>f.properties.kind==='road').geometry.coordinates.length>2&&roadSources.direct.length===0&&roadSources.labels[0].includes('沿路'),{direct,road});
  check('Switch is accessible and retains stop order',await p.locator('[data-route-mode="road"]').getAttribute('aria-pressed')==='true'&&JSON.stringify(roadSources.saved)===JSON.stringify(pair));
  await p.evaluate(()=>window.foodCityMap.food.focusStops());await p.waitForFunction(()=>window.foodCityMap.map.areTilesLoaded()&&!window.foodCityMap.map.isMoving(),undefined,{timeout:10000});await p.screenshot({path:'../output/playwright/food-road-desktop.png'});
  await p.locator('[data-route-mode="direct"]').click();const back=await sources(p);
  check('Switching back removes all road geometry and road badges',back.road.length===0&&back.direct.length===1&&back.labels.length===1&&back.labels[0].includes('直线')&&JSON.stringify(back.saved)===JSON.stringify(pair));
  await p.locator('[data-route-mode="road"]').click();await done(p);check('Network and worker are reused',requests.filter(u=>u.includes('network.json')).length===1&&requests.filter(u=>u.includes('worker.cjs')).length===1);
  await select(p,['video-tiedan-gangzi']);await done(p);const three=await stats(p);
  check('Three stops produce two road legs and their sum',three.phase==='ready'&&three.count===2&&(await sources(p)).labels.length===2&&three.total>road.total);
  await p.evaluate(()=>window.foodCityMap.food.moveStop('video-tiedan-gangzi',-1));await done(p);const moved=await stats(p);
  check('Reordering recalculates consecutive road legs',moved.count===2&&Math.abs(moved.total-three.total)>1&&(await sources(p)).saved[1]==='video-tiedan-gangzi');
  await p.evaluate(()=>window.foodCityMap.food.toggleSave('video-tiedan-gangzi'));await done(p);
  await p.goto(base+'/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.routePreview.phase==='ready',undefined,{timeout:30000});
  check('Mode preference survives reload without changing selected stops',(await stats(p)).mode==='road'&&JSON.stringify((await sources(p)).saved)===JSON.stringify(pair));
  for(const size of [{width:390,height:844},{width:320,height:740},{width:736,height:414}]){
   await p.setViewportSize(size);await p.evaluate(()=>window.foodCityMap.food.focusStops());await p.waitForTimeout(250);
   const geometry=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {dock:box('#trip-dock'),toggle:box('#trip-distance-modes'),view:box('.view-dock'),overflow:document.documentElement.scrollWidth>innerWidth};});
   const {dock,toggle,view,overflow}=geometry,overlap=!(view.right<=dock.x||dock.right<=view.x||view.bottom<=dock.y||dock.bottom<=view.y);
   check('Controls fit '+size.width+'×'+size.height,!overflow&&dock.x>=0&&dock.right<=size.width&&dock.y>=0&&dock.bottom<=size.height&&toggle.x>=dock.x&&toggle.right<=dock.right&&!overlap,geometry);
   await p.locator('[data-route-mode="direct"]').click();await p.locator('[data-route-mode="road"]').click();await done(p);
   if(size.width===390){await p.waitForFunction(()=>window.foodCityMap.map.areTilesLoaded()&&!window.foodCityMap.map.isMoving(),undefined,{timeout:10000});await p.screenshot({path:'../output/playwright/food-road-mobile.png'});}
  }
  const fail=await fresh();let attempts=0;await fail.route('**/data/food-road-network.json',async r=>{attempts++;if(attempts===1)await r.fulfill({status:503,body:'Unavailable'});else await r.continue();});
  await ready(fail);await select(fail);await fail.locator('[data-route-mode="road"]').click();await done(fail);const bad=await sources(fail);
  check('A failed network clears routes and offers a retry',(await stats(fail)).phase==='error'&&bad.direct.length===0&&bad.road.length===0&&bad.labels.length===0&&bad.caption.includes('重试'));
  await fail.locator('[data-route-mode="road"]').click();await done(fail);check('Retry recovers without reloading the page',(await stats(fail)).phase==='ready'&&attempts===2);
  const partial=await fresh();await partial.route('**/data/food-road-network.json',async r=>{
   const body=await partial.evaluate(()=>{const f=window.foodCityMap.food,a=f.records.find(r=>r.id==='video-nangua-sanyangzi').coordinates,b=f.records.find(r=>r.id==='video-bailong-chunhong').coordinates,c=f.records.find(r=>r.id==='video-nangua-nendouya').coordinates;return {schemaVersion:1,kind:'food-road-planning-network',coordinateSystem:'WGS84',nodes:[[1,...a],[2,...b],[3,...c],[4,c[0]+.001,c[1]]],ways:[{id:10,nodes:[1,2],tags:{highway:'footway'}},{id:20,nodes:[3,4],tags:{highway:'footway'}}]};});await r.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  await ready(partial);await select(partial,[...pair,'video-nangua-nendouya']);await partial.locator('[data-route-mode="road"]').click();await done(partial);const part=await sources(partial),partStats=await stats(partial);
  check('Disconnected legs show a partial result without fabricated lines or full total',partStats.phase==='partial'&&partStats.count===1&&partStats.missing===1&&part.direct.length===0&&part.road.filter(f=>f.properties.kind==='road').length===1&&part.caption.includes('1 段道路暂未连通'));
  const slow=await fresh();let release;const gate=new Promise(resolve=>release=resolve);await slow.route('**/data/food-road-network.json',async r=>{await gate;await r.continue();});
  await ready(slow);await select(slow);await slow.locator('[data-route-mode="road"]').click();await slow.waitForFunction(()=>window.foodCityMap.food.routePreview.phase==='loading');await slow.locator('[data-route-mode="direct"]').click();release();await slow.waitForTimeout(1400);const cancelled=await sources(slow);
  check('Late network results cannot overwrite a newer direct-mode selection',(await stats(slow)).mode==='direct'&&cancelled.road.length===0&&cancelled.labels.every(t=>t.includes('直线')));
  await slow.locator('[data-route-mode="road"]').click();await slow.evaluate(()=>{const f=window.foodCityMap.food;f.toggleSave('video-bailong-chunhong');f.toggleSave('video-tiedan-gangzi');});await done(slow);
  check('Fast selection changes use only the latest stops',(await stats(slow)).mode==='road'&&(await stats(slow)).count===1&&(await sources(slow)).saved[1]==='video-tiedan-gangzi');
  await slow.evaluate(()=>window.foodCityMap.food.deactivate());check('Leaving food mode clears all route lines',(await sources(slow)).road.length===0&&(await sources(slow)).direct.length===0);
  const standalone=await fresh(),external=[];standalone.on('request',r=>{if(/food-road-(network|worker)/.test(r.url()))external.push(r.url());});await ready(standalone,'/preview.html?view=food');await select(standalone);await standalone.locator('[data-route-mode="road"]').click();await done(standalone);
  check('Standalone preview computes with embedded network and worker',(await stats(standalone)).phase==='ready'&&Math.abs((await stats(standalone)).total-road.total)<.001&&external.length===0);
 }catch(e){check('Browser flow completes',false,e.message)}finally{for(const c of contexts)await c.close();}
 check('No browser runtime errors',errors.length===0,errors);return {verifiedOn:'2026-10-28',checks,passed:checks.every(c=>c.passed)};
}
