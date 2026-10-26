async page => {
  const baseURL='http://127.0.0.1:8791/';
  const report={date:'2026-10-21',scope:'HTTP loading and intentional failure regression; no file-protocol test.',checks:[],issues:[]};
  const snapshot=target=>target.evaluate(()=>({
    loadingVisible:!document.querySelector('#loading').hidden,
    errorVisible:!document.querySelector('#map-error').hidden,
    errorText:document.querySelector('#map-error-text').textContent,
    detail:document.querySelector('#map-error-detail').textContent,
    stats:window.foodCityMap?(window.foodCityMap.map.getLayer('bridge-roads')?window.foodCityMap.getStats():{ready:window.foodCityMap.ready,stylePending:true}):undefined,
    terrainOption:{checked:document.querySelector('#terrain-option').checked,disabled:document.querySelector('#terrain-option').disabled}
  }));
  await page.goto('about:blank');
  async function scenario(name,run){
    const target=await page.context().newPage();
    const events={pageErrors:[],consoleErrors:[],failedRequests:[],workers:[]};
    target.on('pageerror',error=>events.pageErrors.push(error.message));
    target.on('console',message=>{if(message.type()==='error')events.consoleErrors.push(message.text());});
    target.on('requestfailed',request=>events.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
    target.on('worker',worker=>events.workers.push(worker.url()));
    target.setDefaultTimeout(15000);
    await target.setViewportSize({width:1440,height:960});
    try {
      const result=await run(target);
      report.checks.push({name,...result,events});
      if(!result.passed)report.issues.push(name);
    }catch(error){report.checks.push({name,passed:false,error:error.message,events});report.issues.push(name);}
    finally{await target.close();}
  }
  await scenario('normal page renders real roads and terrain with classic worker',async target=>{
    await target.goto(baseURL);
    await target.waitForFunction(()=>window.foodCityMap?.ready===true);
    await target.waitForFunction(()=>Number.isFinite(window.foodCityMap?.getStats().elevationMetres)&&window.foodCityMap.getStats().elevationMetres>0);
    const state=await snapshot(target);
    await target.screenshot({path:'D:/codex/美食网站/output/playwright/loading-normal.png'});
    return {passed:!state.loadingVisible&&!state.errorVisible&&state.stats.ready&&state.stats.renderedRoadFragments>0&&state.stats.terrain&&state.stats.failures.length===0,state};
  });
  await scenario('blocked DEM degrades to usable roads and search',async target=>{
    await target.route('**/data/terrain/**/*.png',route=>route.abort('failed'));
    await target.goto(baseURL);
    await target.waitForFunction(()=>window.foodCityMap?.ready===true&&document.querySelector('#terrain-option').disabled);
    await target.locator('#search-input').fill('沧白路');
    await target.locator('#search-results button').filter({hasText:'沧白路'}).first().click();
    await target.waitForFunction(()=>window.foodCityMap?.getStats().selectedRoad==='沧白路');
    await target.waitForFunction(()=>!window.foodCityMap.map.isMoving());
    const state=await snapshot(target);
    await target.screenshot({path:'D:/codex/美食网站/output/playwright/loading-no-terrain.png'});
    return {passed:!state.loadingVisible&&!state.errorVisible&&state.stats.ready&&state.stats.renderedRoadFragments>0&&!state.stats.terrain&&state.stats.selectedRoad==='沧白路'&&state.terrainOption.disabled&&!state.terrainOption.checked,state};
  });
  await scenario('blocked city archive shows a visible error instead of endless loading',async target=>{
    await target.route('**/data/chongqing.pmtiles',route=>route.abort('failed'));
    await target.goto(baseURL);
    await target.waitForFunction(()=>!document.querySelector('#map-error').hidden);
    const state=await snapshot(target);
    await target.screenshot({path:'D:/codex/美食网站/output/playwright/loading-no-archive.png'});
    return {passed:!state.loadingVisible&&state.errorVisible&&!state.stats?.ready&&state.detail.includes('加载阶段')&&state.errorText.length>5,state};
  });
  await scenario('blocked app bundle is reported by independent bootstrap',async target=>{
    await target.route('**/app.js',route=>route.abort('failed'));
    await target.goto(baseURL);
    await target.waitForFunction(()=>!document.querySelector('#map-error').hidden);
    const state=await snapshot(target);
    await target.screenshot({path:'D:/codex/美食网站/output/playwright/loading-no-app.png'});
    return {passed:!state.loadingVisible&&state.errorVisible&&!state.stats&&state.detail.includes('app.js'),state};
  });
  await scenario('silent worker reaches bounded 20 second timeout',async target=>{
    let workerResponses=0;
    await target.clock.install();
    await target.route('**/map-worker.cjs',route=>{workerResponses++;return route.fulfill({status:200,contentType:'application/javascript',body:'self.onmessage = () => {};'});});
    await target.goto(baseURL,{waitUntil:'domcontentloaded'});
    await target.waitForFunction(()=>!!window.foodCityMap);
    await target.waitForEvent('worker').catch(()=>null);
    const before=await snapshot(target);
    await target.clock.fastForward(21000);
    await target.waitForFunction(()=>!document.querySelector('#map-error').hidden);
    const after=await snapshot(target);
    await target.screenshot({path:'D:/codex/美食网站/output/playwright/loading-worker-timeout.png'});
    return {passed:workerResponses>0&&before.loadingVisible&&!before.errorVisible&&!after.loadingVisible&&after.errorVisible&&!after.stats.ready&&after.errorText.includes('超时')&&after.detail.includes('20 秒'),workerResponses,before,after};
  });
  report.passed=report.issues.length===0;
  return report;
}
