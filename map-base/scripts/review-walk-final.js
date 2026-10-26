async page=>{
  const report={date:'2026-10-23',checks:[],issues:[]},errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const settle=()=>page.waitForFunction(()=>{const a=window.foodCityMap;return a?.ready&&!a.map.isMoving()&&a.map.areTilesLoaded()&&(!a.walk.active||!a.walk.route||(a.map.isSourceLoaded('walk-trial')&&a.map.queryRenderedFeatures({layers:['walk-trial-line']}).length>0));},undefined,{timeout:20000});
  try{
    await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:8791/?view=food');await page.waitForFunction(()=>window.foodCityMap?.food?.active);await settle();
    await page.locator('#walk-entry').click();await page.waitForFunction(()=>window.foodCityMap.walk.active);await settle();
    const shown=await page.evaluate(()=>({walk:window.foodCityMap.walk.getStats(),visibleFood:[...document.querySelectorAll('.food-card')].filter(e=>getComputedStyle(e).visibility!=='hidden').length,endpoints:document.querySelectorAll('.walk-endpoint').length,rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length}));
    check('Trial hides candidate pins and renders only the two road endpoints',shown.visibleFood===0&&shown.endpoints===2&&shown.walk.segments===50&&shown.rendered>0,shown);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/walk-final-desktop.png'});
    await page.locator('#walk-close').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.food-card')].every(e=>getComputedStyle(e).visibility==='visible'));
    check('Closing restores candidate visibility',true);
    await page.setViewportSize({width:320,height:680});await page.locator('#walk-entry').click();await settle();
    const mobile=await page.evaluate(()=>{
      const p=document.querySelector('#walk-panel').getBoundingClientRect(),points=[...document.querySelectorAll('.walk-endpoint')].map(e=>e.getBoundingClientRect());
      return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],panel:[p.left,p.top,p.right,p.bottom],points:points.map(r=>[r.left,r.top,r.right,r.bottom]),clear:points.every(r=>r.bottom<p.top||r.right<p.left||r.left>p.right)};
    });
    check('Final 320 layout fits and panel leaves both road endpoints clear',mobile.scroll[0]===320&&mobile.scroll[1]===680&&mobile.panel[0]>=0&&mobile.panel[2]<=320&&mobile.panel[1]>=0&&mobile.panel[3]<=680&&mobile.clear,mobile);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/walk-final-320.png'});
    await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>window.foodCityMap.walk.show());await settle();
    check('Final view has no browser exceptions',errors.length===0,{errors});
  }catch(e){report.issues.push(e.message);}
  report.passed=report.issues.length===0;return report;
}
