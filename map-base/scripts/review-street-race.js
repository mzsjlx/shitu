async page=>{
  const url='http://127.0.0.1:8791/';
  const report={date:'2026-10-22',scope:'HTTP street loading intent and timeout regression; no real-world walkability claim',checks:[],issues:[]};
  const camera=target=>target.evaluate(()=>{const a=window.foodCityMap,m=a.map;return {center:m.getCenter().toArray(),zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing(),selected:a.getStats().selectedRoad,street:a.street.getStats(),base:a.ready};});
  const settled=target=>target.waitForFunction(()=>{const a=window.foodCityMap;return a?.ready&&!a.map.isMoving()&&a.map.areTilesLoaded();},undefined,{timeout:20000});
  const same=(a,b)=>a.center.every((v,i)=>Math.abs(v-b.center[i])<.000005)&&Math.abs(a.zoom-b.zoom)<.005&&Math.abs(a.pitch-b.pitch)<.02&&Math.abs(a.bearing-b.bearing)<.02;
  await page.goto('about:blank');
  async function run(name,body){
    const target=await page.context().newPage();target.setDefaultTimeout(18000);
    let release=()=>{};
    try{
      await target.setViewportSize({width:1200,height:800});
      await target.emulateMedia({reducedMotion:'reduce'});
      await target.goto(url);await settled(target);
      let requests=0,requested;
      const sawRequest=new Promise(resolve=>requested=resolve);
      const gate=new Promise(resolve=>release=resolve);
      const handler=async route=>{requests++;requested();await gate;try{await route.continue();}catch{}};
      await target.route('**/data/street-detail.geojson',handler);
      const result=await body({target,sawRequest,release:()=>release(),handler,getRequests:()=>requests});
      report.checks.push({name,...result});if(!result.passed)report.issues.push(name);
    }catch(error){report.checks.push({name,passed:false,error:error.message});report.issues.push(name);}
    finally{release();await target.close();}
  }
  const delayed=async({target,sawRequest})=>{await target.locator('#street-entry').click();await sawRequest;};
  const complete=async({target,release})=>{release();await target.waitForFunction(()=>window.foodCityMap.street.getStats().phase==='loaded');await settled(target);return camera(target);};
  await run('reset during delayed street load keeps city camera',async t=>{
    await delayed(t);await t.target.locator('#reset-view').click();await settled(t.target);
    const expected=await camera(t.target),after=await complete(t);
    return {passed:same(expected,after)&&!after.street.active&&after.base,expected,after};
  });
  await run('disabling street during delayed load prevents late focus',async t=>{
    await delayed(t);await t.target.locator('#layers-toggle').click();await t.target.locator('#street-option').uncheck();
    const expected=await camera(t.target),after=await complete(t);
    return {passed:same(expected,after)&&!after.street.active&&!after.street.enabled&&after.base,expected,after};
  });
  await run('switching to 2D during delayed load preserves flat view',async t=>{
    await delayed(t);await t.target.locator('#view-2d').click();await settled(t.target);
    const expected=await camera(t.target),after=await complete(t);
    return {passed:same(expected,after)&&Math.abs(after.pitch)<.01&&after.base,expected,after};
  });
  await run('road search during delayed load keeps searched road camera',async t=>{
    await delayed(t);await t.target.locator('#search-input').fill('沧白路');await t.target.locator('#search-input').press('Enter');await settled(t.target);
    const expected=await camera(t.target),after=await complete(t);
    return {passed:same(expected,after)&&after.selected==='沧白路'&&after.base,expected,after};
  });
  await run('ordinary delayed focus still opens street once data arrives',async t=>{
    await delayed(t);const before=await camera(t.target),after=await complete(t);
    await t.target.screenshot({path:'D:/codex/美食网站/output/playwright/street-race-normal.png'});
    return {passed:!before.street.active&&after.street.active&&after.zoom>18&&after.street.renderedFeatures>0&&t.getRequests()===1,before,after,requests:t.getRequests()};
  });
  await run('12 second timeout preserves base and retry recovers cleanly',async t=>{
    await t.target.clock.install();await delayed(t);
    await t.target.clock.fastForward(12500);
    await t.target.waitForFunction(()=>window.foodCityMap.street.getStats().phase==='error');
    const timedOut=await t.target.evaluate(()=>({base:window.foodCityMap.ready,street:window.foodCityMap.street.getStats(),entry:document.querySelector('#street-entry').textContent,spinnerHidden:document.querySelector('#loading').hidden,mapErrorHidden:document.querySelector('#map-error').hidden}));
    await t.target.screenshot({path:'D:/codex/美食网站/output/playwright/street-race-timeout.png'});
    t.release();await t.target.unroute('**/data/street-detail.geojson',t.handler);
    await t.target.locator('#street-entry').click();
    await t.target.waitForFunction(()=>window.foodCityMap.street.getStats().phase==='loaded');await settled(t.target);
    const after=await camera(t.target);
    return {passed:timedOut.base&&timedOut.street.phase==='error'&&timedOut.street.error.includes('超时')&&timedOut.entry.includes('重试')&&timedOut.spinnerHidden&&timedOut.mapErrorHidden&&after.street.active&&after.street.renderedFeatures>0&&after.base,timedOut,after};
  });
  report.passed=report.issues.length===0;return report;
}
