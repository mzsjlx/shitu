async page=>{
  const browser=page.context().browser(),base='http://127.0.0.1:8791',checks=[],errors=[],external=[];
  const check=(name,passed,details)=>checks.push({name,passed:!!passed,details});
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async r=>{external.push(r.request().url());await r.abort();});
  const settle=async()=>{await p.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded());await p.evaluate(()=>new Promise(r=>{const m=window.foodCityMap.map;m.once('idle',r);m.triggerRepaint();}));};
  try{
    await p.goto(base+'/?view=landmark');await settle();await p.waitForFunction(()=>window.foodCityMap.landmark?.rendered);
    await p.evaluate(()=>window.foodCityMap.map.jumpTo({zoom:14.8}));await settle();
    let s=await p.evaluate(()=>({l:window.foodCityMap.landmark.getStats(),filter:window.foodCityMap.map.getFilter('buildings-3d')}));
    check('Merged lower source zoom restores original building and hides detailed model',!s.l.rendered&&!s.l.replacingSourceBuilding&&!JSON.stringify(s.filter).includes('35185311667126'),s);
    await p.locator('#layers-toggle').click();await p.locator('#landmark-entry').click();await settle();await p.waitForFunction(()=>window.foodCityMap.landmark.rendered);
    const supported=await p.evaluate(()=>{
      const gl=window.foodCityMap.landmark.gl,ext=gl.getExtension('WEBGL_lose_context');
      if(!ext)return false;window.__qaGLRestored=false;window.foodCityMap.map.once('webglcontextrestored',()=>{window.__qaGLRestored=true;});ext.loseContext();setTimeout(()=>ext.restoreContext(),200);return true;
    });
    if(supported){await p.waitForFunction(()=>window.__qaGLRestored&&window.foodCityMap.map.areTilesLoaded()&&window.foodCityMap.landmark.rendered&&window.foodCityMap.getStats().renderedRoadFragments>0,undefined,{timeout:30000});}
    s=await p.evaluate(()=>({map:window.foodCityMap.getStats(),l:window.foodCityMap.landmark.getStats()}));
    check('Shared WebGL context restores roads and model with safe flat-terrain recovery',supported&&s.map.ready&&!s.map.terrain&&s.map.renderedRoadFragments>0&&s.l.rendered&&!s.l.error&&s.l.elevationMetres===0&&s.l.lastRender.calls===8,{supported,...s});
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/hongyadong-context-restored.png'});
    await p.locator('#food-entry').click();await p.waitForFunction(()=>window.foodCityMap.food.active);await settle();
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/hongyadong-food-overview.png'});
    check('Food cards and real city landmark coexist after GL restoration',await p.locator('.food-card').count()===2&&await p.evaluate(()=>window.foodCityMap.landmark.rendered),await p.evaluate(()=>window.foodCityMap.getStats()));
    await p.evaluate(()=>{const f=window.foodCityMap,l=f.landmark;f.map.removeLayer(l.id);l.prepare=()=>{throw new Error('Synthetic isolated first-prepare failure on reattach');};l.error=null;f.map.addLayer(l,'selected-road-edge');f.map.triggerRepaint();});
    await p.waitForFunction(()=>!!window.foodCityMap.landmark.error);await settle();
    s=await p.evaluate(()=>({map:window.foodCityMap.getStats(),l:window.foodCityMap.landmark.getStats(),filter:window.foodCityMap.map.getFilter('buildings-3d')}));
    check('Reattached model preparation failure leaves base map and cards intact',s.map.ready&&s.map.renderedRoadFragments>0&&s.map.foodCards===2&&!s.l.replacingSourceBuilding&&!s.l.prepared&&!JSON.stringify(s.filter).includes('35185311667126')&&await p.locator('#map-error').isHidden(),s);
    check('No uncaught errors or external requests in boundary checks',!errors.length&&!external.length,{errors,external});
  }catch(e){check('Boundary run completes',false,e.message);}finally{await context.close();}
  return {date:'2026-10-26',scope:'Targeted final-source followup: merged source zoom, actual synthetic WebGL loss/restoration, model reattach failure and food coexistence. Isolated browser only.',checks,errors,external,summary:{passed:checks.filter(c=>c.passed).length,total:checks.length,failed:checks.filter(c=>!c.passed).length}};
}
