async page=>{
  const report={date:'2026-10-23',scope:'Isolated browser contexts for itinerary loading, storage and exact standalone HTTP; no real entrance verification.',checks:[],issues:[]};
  const key='foodcity:wants:chongqing:v1',ids=['osm-node-13649952401','osm-node-4460519589'];
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving(),undefined,{timeout:25000});
  async function run(name,body){
    const context=await page.context().browser().newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
    const p=await context.newPage();
    try{await body(p,context);}catch(e){check(name,false,{error:e.message});}finally{await context.close();}
  }
  await run('Default map remains independent',async p=>{
    const requests=[];p.on('request',r=>requests.push(r.url()));await p.goto('http://127.0.0.1:8791/');await ready(p);
    const result=await p.evaluate(()=>({hidden:document.querySelector('#trip-dock').hidden,food:window.foodCityMap.food.getStats(),dialogs:[...document.querySelectorAll('dialog[open]')].length}));
    check('Default city map does not fetch food or open the itinerary',result.hidden&&result.food.phase==='unloaded'&&result.dialogs===0&&!requests.some(u=>u.endsWith('food-records.json')),result);
  });
  await run('Late loading respects 2D intent',async p=>{
    await p.addInitScript(({key,ids})=>localStorage.setItem(key,JSON.stringify(ids)),{key,ids});
    let release,requested;const gate=new Promise(r=>release=r),request=new Promise(r=>requested=r);
    await p.route('**/data/food-records.json',async route=>{requested();await gate;try{await route.continue();}catch{}});
    try{
      await p.goto('http://127.0.0.1:8791/');await ready(p);await p.locator('#food-entry').click();await request;
      await p.locator('#view-2d').click();await ready(p);release();
      await p.waitForFunction(()=>window.foodCityMap.food.phase==='loaded');
      const result=await p.evaluate(key=>({active:window.foodCityMap.food.active,dockHidden:document.querySelector('#trip-dock').hidden,pitch:window.foodCityMap.map.getPitch(),saved:JSON.parse(localStorage.getItem(key))}),key);
      check('Food completing after a 2D switch leaves dock closed and saved order intact',!result.active&&result.dockHidden&&result.pitch===0&&JSON.stringify(result.saved)===JSON.stringify(ids),result);
    }finally{release();}
  });
  await run('Failed food fetch preserves saved order',async p=>{
    await p.addInitScript(({key,ids})=>localStorage.setItem(key,JSON.stringify(ids)),{key,ids});
    const handler=route=>route.fulfill({status:503,body:'test failure'});await p.route('**/data/food-records.json',handler);
    await p.goto('http://127.0.0.1:8791/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.phase==='error');
    const before=await p.evaluate(key=>({saved:JSON.parse(localStorage.getItem(key)),dockHidden:document.querySelector('#trip-dock').hidden,base:window.foodCityMap.ready}),key);
    await p.unroute('**/data/food-records.json',handler);await p.locator('#food-entry').click();await p.waitForFunction(()=>window.foodCityMap.food.active);
    const after=await p.evaluate(()=>({saved:window.foodCityMap.food.saved,chips:document.querySelectorAll('#trip-stops .trip-stop').length}));
    check('HTTP error keeps old wants and retry restores ordered stops',before.base&&before.dockHidden&&JSON.stringify(before.saved)===JSON.stringify(ids)&&JSON.stringify(after.saved)===JSON.stringify(ids)&&after.chips===2,{before,after});
  });
  await run('Storage quota communicates memory-only state',async p=>{
    await p.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Synthetic storage quota','QuotaExceededError');};});
    await p.goto('http://127.0.0.1:8791/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.active);await ready(p);
    await p.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();await p.locator('#food-save').click();await p.locator('#food-close').click();await p.locator('#trip-manage').click();
    const result=await p.evaluate(()=>({saved:window.foodCityMap.food.saved,error:window.foodCityMap.food.getStats().saveError,caption:document.querySelector('#trip-dock-caption').textContent,note:document.querySelector('#trip-save-note').textContent,noteVisible:!document.querySelector('#trip-save-note').hidden,rows:document.querySelectorAll('#wants-list li').length}));
    check('Quota failure retains the stop and clearly reports unsaved changes',result.saved.length===1&&result.error&&result.caption.includes('未保存')&&result.noteVisible&&result.note.includes('暂未保存')&&result.rows===1,result);
  });
  await run('Malformed previous wants remains untouched until an edit',async p=>{
    await p.addInitScript(key=>localStorage.setItem(key,'not-valid-json'),key);await p.goto('http://127.0.0.1:8791/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.active);
    const result=await p.evaluate(key=>({raw:localStorage.getItem(key),count:window.foodCityMap.food.saved.length,title:document.querySelector('#trip-dock-title').textContent}),key);
    check('Malformed old wants does not crash or get silently overwritten on load',result.raw==='not-valid-json'&&result.count===0&&result.title.includes('留住'),result);
  });
  await run('Standalone itinerary is self-contained',async p=>{
    const url='http://127.0.0.1:8791/preview.html?view=food',requests=[],errors=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
    await p.goto(url);await p.waitForFunction(()=>window.foodCityMap?.food?.active);await ready(p);
    for(const name of ['超级李板凳面','赵二火锅']){await p.getByRole('button',{name:'查看'+name,exact:true}).click();await p.locator('#food-save').click();await p.locator('#food-close').click();}
    await p.locator('#trip-manage').click();await p.locator('#wants-list .trip-row').first().locator('.trip-down').click();await p.locator('#wants-close').click();
    const result=await p.evaluate(()=>({order:window.foodCityMap.food.saved,chips:document.querySelectorAll('#trip-stops .trip-stop').length,routeEligible:window.foodCityMap.food.records.map(r=>r.routeEligible),image:window.foodCityMap.food.records[0].spriteURL.startsWith('data:image/jpeg;base64,')}));
    const extra=requests.filter(u=>/^https?:/.test(u)&&u!==url);
    check('Exact standalone supports adding and reordering without subsidiary HTTP',result.chips===2&&JSON.stringify(result.order)===JSON.stringify([...ids].reverse())&&result.routeEligible.every(x=>x===false)&&result.image&&extra.length===0&&errors.length===0,{...result,extra,errors});
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/trip-edge-standalone.png'});
  });
  report.passed=report.issues.length===0;return report;
}
