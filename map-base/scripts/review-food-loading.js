async page=>{
  const report={date:'2026-10-22',scope:'Optional food-loading intent, retry and standalone HTTP review.',checks:[],issues:[]};
  const settled=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded(),undefined,{timeout:20000});
  const camera=p=>p.evaluate(()=>({base:window.foodCityMap.getStats(),food:window.foodCityMap.food.getStats()}));
  const same=(a,b)=>a.center.every((v,i)=>Math.abs(v-b.center[i])<.000005)&&Math.abs(a.zoom-b.zoom)<.005&&Math.abs(a.pitch-b.pitch)<.02;
  async function run(name,body){
    const p=await page.context().newPage();let release=()=>{};
    try{
      await p.setViewportSize({width:1200,height:800});await p.emulateMedia({reducedMotion:'reduce'});
      await p.goto('http://127.0.0.1:8791/');await settled(p);
      let received;const requested=new Promise(r=>received=r),gate=new Promise(r=>release=r);
      const handler=async route=>{received();await gate;try{await route.continue();}catch{}};
      await p.route('**/data/food-records.json',handler);
      const result=await body({p,requested,release,handler});
      report.checks.push({name,...result});if(!result.passed)report.issues.push(name);
    }catch(e){report.checks.push({name,passed:false,error:e.message});report.issues.push(name);}
    finally{release();await p.close();}
  }
  for(const [name,selector] of [['Reset during food loading keeps the city camera','#reset-view'],['2D during food loading keeps the flat camera','#view-2d']]){
    await run(name,async t=>{
      await t.p.locator('#food-entry').click();await t.requested;
      await t.p.locator(selector).click();await settled(t.p);const expected=await camera(t.p);
      t.release();await t.p.waitForFunction(()=>window.foodCityMap.food.phase==='loaded');await settled(t.p);
      const after=await camera(t.p);
      return {passed:after.base.ready&&!after.food.active&&after.base.foodCards===0&&same(expected.base,after.base),expected,after};
    });
  }
  await run('12-second food timeout preserves the base map and retry recovers',async t=>{
    await t.p.clock.install();await t.p.locator('#food-entry').click();await t.requested;
    await t.p.clock.fastForward(12500);await t.p.waitForFunction(()=>window.foodCityMap.food.phase==='error');
    const timedOut=await t.p.evaluate(()=>({base:window.foodCityMap.getStats(),food:window.foodCityMap.food.getStats(),note:document.querySelector('#food-load-note').textContent,spinnerHidden:document.querySelector('#loading').hidden,mapErrorHidden:document.querySelector('#map-error').hidden}));
    await t.p.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-timeout.png'});
    t.release();await t.p.unroute('**/data/food-records.json',t.handler);await t.p.locator('#food-entry').click();
    await t.p.waitForFunction(()=>window.foodCityMap.food.active);await settled(t.p);const after=await camera(t.p);
    return {passed:timedOut.base.ready&&timedOut.food.error.includes('超时')&&timedOut.note.includes('重试')&&timedOut.spinnerHidden&&timedOut.mapErrorHidden&&after.base.foodCards===2&&after.food.error===null,timedOut,after};
  });
  const p=await page.context().newPage(),url='http://127.0.0.1:8791/preview.html?view=food',requests=[],errors=[];
  try{
    p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
    await p.setViewportSize({width:1440,height:960});await p.goto(url);
    await p.waitForFunction(()=>window.foodCityMap?.food?.active);await settled(p);
    const food=await p.evaluate(()=>({base:window.foodCityMap.getStats(),food:window.foodCityMap.food.getStats(),embedded:window.foodCityMap.food.records.every(r=>r.spriteURL.startsWith('data:image/jpeg;base64,'))}));
    const additionalHTTP=requests.filter(u=>/^https?:/.test(u)&&u!==url);
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-standalone.png'});
    const passed=food.base.foodCards===2&&food.embedded&&additionalHTTP.length===0&&errors.length===0;
    report.checks.push({name:'Exact standalone HTML serves both food cards without additional HTTP',passed,food,additionalHTTP,errors});if(!passed)report.issues.push('Standalone food');
  }catch(e){report.issues.push('Standalone execution: '+e.message);}finally{await p.close();}
  report.passed=report.issues.length===0;return report;
}
