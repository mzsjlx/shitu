async page=>{
  const report={date:'2026-10-22',scope:'Local route-trial loading, camera intent and exact embedded HTML. No navigation or real-world access validation.',checks:[],issues:[]};
  const settled=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded(),undefined,{timeout:20000});
  const read=p=>p.evaluate(()=>({base:window.foodCityMap.getStats(),walk:window.foodCityMap.walk.getStats(),panelHidden:document.querySelector('#walk-panel').hidden,option:document.querySelector('#walk-option').checked}));
  const same=(a,b)=>a.center.every((v,i)=>Math.abs(v-b.center[i])<.000005)&&Math.abs(a.zoom-b.zoom)<.005&&Math.abs(a.pitch-b.pitch)<.02;
  async function run(name,body){
    const p=await page.context().newPage();let release=()=>{};
    try{
      await p.setViewportSize({width:1200,height:800});await p.emulateMedia({reducedMotion:'reduce'});
      await p.goto('http://127.0.0.1:8791/');await settled(p);
      let received;const requested=new Promise(r=>received=r),gate=new Promise(r=>release=r);
      const handler=async route=>{received();await gate;try{await route.continue();}catch{}};
      await p.route('**/data/walk-network.json',handler);
      const result=await body({p,requested,release,handler});report.checks.push({name,...result});if(!result.passed)report.issues.push(name);
    }catch(e){report.checks.push({name,passed:false,error:e.message});report.issues.push(name);}finally{release();await p.close();}
  }
  for(const [name,selector]of [['Reset while road data loads preserves city view','#reset-view'],['2D while road data loads preserves flat view','#view-2d']]){
    await run(name,async t=>{
      await t.p.locator('#layers-toggle').click();await t.p.locator('#walk-option').check();await t.requested;
      await t.p.locator(selector).click();await settled(t.p);const expected=await read(t.p);
      t.release();await t.p.waitForFunction(()=>window.foodCityMap.walk.phase==='loaded');await settled(t.p);const after=await read(t.p);
      return {passed:after.base.ready&&!after.walk.active&&after.panelHidden&&!after.option&&same(expected.base,after.base),expected,after};
    });
  }
  await run('12-second optional-road timeout leaves base usable and retry recovers',async t=>{
    await t.p.clock.install();await t.p.locator('#layers-toggle').click();await t.p.locator('#walk-option').check();await t.requested;
    await t.p.clock.fastForward(12500);await t.p.waitForFunction(()=>window.foodCityMap.walk.phase==='error');
    const before=await t.p.evaluate(()=>({base:window.foodCityMap.ready,walk:window.foodCityMap.walk.getStats(),retryVisible:!document.querySelector('#walk-load-note').hidden,option:document.querySelector('#walk-option').checked,mapErrorHidden:document.querySelector('#map-error').hidden}));
    await t.p.screenshot({path:'D:/codex/美食网站/output/playwright/walk-loading-timeout.png'});
    t.release();await t.p.unroute('**/data/walk-network.json',t.handler);await t.p.locator('#walk-retry').click();
    await t.p.waitForFunction(()=>window.foodCityMap.walk.active);await settled(t.p);const after=await read(t.p);
    return {passed:before.base&&before.walk.error.includes('超时')&&before.retryVisible&&!before.option&&before.mapErrorHidden&&after.walk.hasRoute&&after.walk.error===null,before,after};
  });
  const p=await page.context().newPage(),url='http://127.0.0.1:8791/preview.html?view=walk',requests=[],errors=[];
  try{
    p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));await p.setViewportSize({width:1440,height:960});await p.goto(url);
    await p.waitForFunction(()=>window.foodCityMap?.walk?.active);await settled(p);
    const walk=await p.evaluate(()=>({stats:window.foodCityMap.walk.getStats(),rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length,endpoints:document.querySelectorAll('.walk-endpoint').length}));
    const additionalHTTP=requests.filter(u=>/^https?:/.test(u)&&u!==url);
    const passed=walk.stats.hasRoute&&walk.stats.segments===50&&walk.stats.entrancesConnected===false&&walk.rendered>0&&walk.endpoints===2&&additionalHTTP.length===0&&errors.length===0;
    report.checks.push({name:'Exact standalone HTML renders actual source path with no additional HTTP',passed,walk,additionalHTTP,errors});if(!passed)report.issues.push('Standalone route trial');
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/walk-standalone.png'});
  }catch(e){report.issues.push('Standalone execution: '+e.message);}finally{await p.close();}
  report.passed=report.issues.length===0;return report;
}
