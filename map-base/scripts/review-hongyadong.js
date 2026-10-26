async page=>{
  const base='http://127.0.0.1:8791',browser=page.context().browser(),artifact='D:/codex/美食网站/output/playwright/';
  const report={date:'2026-10-26',scope:'Isolated Chromium contexts: shared-depth custom landmark, camera/mode transitions, optional failures, food/wants regression, responsive UI and HTTP standalone. No real user browser storage or external services accessed; mobile sizes are emulated.',checks:[],issues:[],errors:[],externalRequests:[]};
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready,undefined,{timeout:30000});
  const settle=async p=>{await p.waitForFunction(()=>!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded(),undefined,{timeout:30000});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const stats=p=>p.evaluate(()=>({map:window.foodCityMap.getStats(),landmark:window.foodCityMap.landmark.getStats(),street:window.foodCityMap.street.getStats(),suppressed:!!window.foodCityMap.street.suppressed,note:!document.getElementById('landmark-note').hidden,focus:document.querySelector('.map-shell').classList.contains('landmark-mode'),buildingFilter:window.foodCityMap.map.getFilter('buildings-3d')}));
  const focus=async p=>{await p.locator('#layers-toggle').click();await p.locator('#landmark-entry').click();await settle(p);};
  async function run(name,body,options={}){
    const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce',...options});
    const p=await context.newPage();p.on('pageerror',e=>report.errors.push(name+': '+e.message));
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async route=>{report.externalRequests.push(route.request().url());await route.abort();});
    try{await body(p,context);}catch(error){check(name+' completes',false,error.message);await p.screenshot({path:artifact+'hongyadong-qa-failure.png'}).catch(()=>{});}
    finally{await context.close();}
  }
  await run('Landmark and mode transitions',async p=>{
    await p.goto(base+'/?view=landmark');await ready(p);await settle(p);
    let s=await stats(p);report.initial=s;
    check('Real map and landmark/planting render within ten material batches',s.map.ready&&s.map.renderedRoadFragments>0&&s.landmark.prepared&&s.landmark.rendered&&s.landmark.lastRender.calls===10&&!s.landmark.error,s);
    check('Source position and authored orientation remain fixed',Math.abs(s.landmark.origin[0]-106.57533890406658)<1e-12&&Math.abs(s.landmark.origin[1]-29.565051423897692)<1e-12&&Math.abs(s.landmark.model.orientationRadians-.35267948549534883)<1e-12,s.landmark.origin);
    check('Entry platform clears every river-front DEM sample',s.map.terrain&&s.landmark.groundSampleElevations.length===3&&s.landmark.groundSampleElevations.every(Number.isFinite)&&Math.abs(s.landmark.elevationMetres+9.6-Math.max(...s.landmark.groundSampleElevations)-.65)<1e-8,s.landmark);
    check('Only the matched source building is replaced while model is visible',s.landmark.replacingSourceBuilding&&JSON.stringify(s.buildingFilter).includes('35185311667126'),s.buildingFilter);
    check('Landmark focus preserves user street preference but restores full city buildings',s.suppressed&&!s.street.active&&s.street.enabled&&s.focus&&s.note,s.street);
    await p.evaluate(()=>new Promise(r=>{const m=window.foodCityMap.map;m.once('idle',r);m.triggerRepaint();}));
    const before=(await stats(p)).landmark.draws;await p.waitForTimeout(1100);const after=(await stats(p)).landmark.draws;
    check('Static model does not keep repainting while idle',after-before<=2,{before,after});
    await p.screenshot({path:artifact+'hongyadong-site-regression-1440.png'});
    await p.locator('#view-2d').click();await settle(p);s=await stats(p);
    check('2D hides custom model and restores original building filter',s.map.pitch===0&&!s.landmark.allowed&&!s.landmark.replacingSourceBuilding&&!s.focus&&!s.suppressed&&!JSON.stringify(s.buildingFilter).includes('35185311667126'),s);
    await p.screenshot({path:artifact+'hongyadong-site-regression-2d.png'});
    await focus(p);await p.locator('#layers-toggle').click();await p.locator('#buildings-option').uncheck();await settle(p);s=await stats(p);
    check('Building toggle hides landmark and restores exact original filter',!s.landmark.allowed&&!s.landmark.replacingSourceBuilding&&!JSON.stringify(s.buildingFilter).includes('35185311667126'),s.landmark);
    await p.locator('#buildings-option').check();await settle(p);s=await stats(p);
    check('Building toggle shows existing model without rebuilding geometry',s.landmark.allowed&&s.landmark.replacingSourceBuilding&&s.landmark.model.generationMs===report.initial.landmark.model.generationMs,s.landmark);
    await p.locator('#terrain-option').uncheck();await settle(p);s=await stats(p);
    check('Flat terrain puts local model on ground zero without changing XY',!s.map.terrain&&s.landmark.elevationMetres===0&&s.landmark.rendered&&s.landmark.origin.toString()===report.initial.landmark.origin.toString(),s.landmark);
    await p.locator('#layers-close').click();await p.screenshot({path:artifact+'hongyadong-site-regression-flat.png'});
    await p.locator('#layers-toggle').click();await p.locator('#terrain-option').check();await p.locator('#layers-close').click();await settle(p);
    await p.locator('#reset-view').click();await settle(p);s=await stats(p);
    check('Reset restores city camera, street behavior and removes focus note',!s.focus&&!s.note&&!s.suppressed&&Math.abs(s.map.zoom-15.8)<1e-8&&s.map.center.every((n,i)=>Math.abs(n-[106.574,29.5628][i])<1e-8),s);
    await focus(p);await p.locator('#layers-toggle').click();await p.locator('#street-option').uncheck();await p.locator('#layers-close').click();await p.locator('#reset-view').click();await settle(p);
    check('Landmark never turns a disabled street preference back on',!(await stats(p)).street.enabled&&!await p.locator('#street-option').isChecked());
    await p.locator('#street-entry').click();await settle(p);await p.waitForFunction(()=>window.foodCityMap.street.active);s=await stats(p);
    check('Street focus exits landmark mode and restores street layer/compression',!s.focus&&!s.suppressed&&s.street.active&&!s.landmark.allowed&&!s.landmark.replacingSourceBuilding&&s.street.renderedFeatures>0,s);
    await p.screenshot({path:artifact+'hongyadong-site-regression-street.png'});
    await focus(p);await p.evaluate(()=>window.foodCityMap.focusRoad('沧白路'));await settle(p);s=await stats(p);
    check('Road selection exits landmark focus without losing road highlighting',!s.focus&&!s.suppressed&&s.map.selectedRoad==='沧白路',s.map);
    await focus(p);await p.locator('#food-entry').click();await p.waitForFunction(()=>window.foodCityMap.food.active);await settle(p);s=await stats(p);
    check('Food exploration exits landmark focus and preserves two source cards',!s.focus&&!s.suppressed&&s.map.foodCards===2,s.map);
    await p.locator('.food-card').first().locator('.food-open').click();
    await p.locator('#food-save').click();await p.locator('#food-close').click();
    check('Food detail and wants still work after landmark transitions',await p.locator('#wants-count').textContent()==='1',await p.locator('#trip-dock-title').textContent());
    await focus(p);await p.screenshot({path:artifact+'hongyadong-site-regression-food-1440.png'});
    await p.locator('#layers-toggle').click();await p.locator('#walk-option').check();await p.waitForFunction(()=>window.foodCityMap.walk.active);await settle(p);s=await stats(p);
    check('Road trial exits landmark focus and clears street suppression',!s.focus&&!s.suppressed&&await p.locator('#walk-panel').isVisible(),s.map);
  });
  await run('Responsive landmark',async p=>{
    for(const [width,height]of [[390,844],[320,680],[736,414]]){
      await p.setViewportSize({width,height});await p.goto(base+'/?view=landmark');await ready(p);await settle(p);
      const s=await stats(p),geometry=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rects:['#landmark-note','.view-dock','#layers-toggle','.maplibregl-ctrl-top-right'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {sel,x:r.x,y:r.y,width:r.width,height:r.height};})}));
      check('Landmark UI fits '+width+'×'+height,s.landmark.rendered&&geometry.scrollWidth===width&&geometry.rects.every(r=>r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1),geometry);
      await p.locator('#layers-toggle').click();await p.locator('#landmark-entry').scrollIntoViewIfNeeded();
      const entry=await p.locator('#landmark-entry').boundingBox();check('Landmark action remains reachable at '+width+'×'+height,entry.y>=0&&entry.y+entry.height<=height,{entry});
      await p.locator('#landmark-entry').click();await settle(p);if(width===390)await p.screenshot({path:artifact+'hongyadong-site-regression-390.png'});
    }
  });
  await run('Optional model failure',async p=>{
    await p.goto(base+'/?view=landmark');await ready(p);await settle(p);
    await p.evaluate(()=>{const l=window.foodCityMap.landmark;l.renderer.render=()=>{throw new Error('Synthetic QA model render failure');};window.foodCityMap.map.triggerRepaint();});
    await p.waitForFunction(()=>!!window.foodCityMap.landmark.error);await settle(p);let s=await stats(p);
    check('Model failure restores source building and leaves real map operational',s.map.ready&&s.map.renderedRoadFragments>0&&!s.landmark.replacingSourceBuilding&&!JSON.stringify(s.buildingFilter).includes('35185311667126')&&await p.locator('#map-error').isHidden()&&await p.locator('#landmark-entry').isDisabled(),s);
    await p.locator('#food-entry').click();await p.waitForFunction(()=>window.foodCityMap.food.active);await settle(p);s=await stats(p);
    check('Food still activates after a model exception',s.map.foodCards===2&&s.map.ready&&!s.map.failures.length,s.map);
  });
  await run('Optional DEM failure',async(p,context)=>{
    await context.route('**/data/terrain/**/*.png',route=>route.fulfill({status:503,body:'Synthetic isolated DEM failure'}));
    await p.goto(base+'/?view=landmark');await ready(p);await settle(p);const s=await stats(p);
    check('DEM failure leaves map and model available on flat ground',s.map.ready&&!s.map.terrain&&s.landmark.rendered&&s.landmark.elevationMetres===0&&await p.locator('#map-error').isHidden(),s);
  });
  await run('HTTP standalone',async p=>{
    const requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
    await p.goto(base+'/preview.html?view=landmark');await ready(p);await settle(p);const s=await stats(p);
    check('Standalone contains identical model and planting without auxiliary HTTP requests',requests.length===1&&s.landmark.rendered&&s.landmark.model.triangles===report.initial.landmark.model.triangles&&s.landmark.lastRender.calls===10,{requests,landmark:s.landmark});
  });
  check('No uncaught page errors or third-party requests',report.errors.length===0&&report.externalRequests.length===0,{errors:report.errors,external:report.externalRequests});
  report.summary={passed:report.checks.filter(x=>x.passed).length,total:report.checks.length,failed:report.issues.length};
  return report;
}
