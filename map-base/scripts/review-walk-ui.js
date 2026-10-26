async page=>{
  const report={date:'2026-10-22',scope:'Independent local browser QA of source-road topology trial, not verified shop navigation or real-world walkability.',checks:[],issues:[],pageErrors:[],consoleErrors:[]};
  const requests=[],responses=[];
  page.on('request',r=>requests.push(r.url()));page.on('response',r=>responses.push({url:r.url(),status:r.status()}));
  page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const settle=async()=>{
    await page.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded(),undefined,{timeout:20000});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  };
  const metrics=()=>page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],panel:box(document.querySelector('#walk-panel')),endpoints:[...document.querySelectorAll('.walk-endpoint')].map(e=>({label:e.getAttribute('aria-label'),...box(e)})),dialogs:[...document.querySelectorAll('dialog[open]')].map(box)};
  });
  try{
    await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:8791/?view=food');await page.waitForFunction(()=>window.foodCityMap?.food?.active);await settle();
    check('Default food view does not request the walk network',!requests.some(u=>u.includes('walk-network'))&&await page.evaluate(()=>window.foodCityMap.walk.phase==='unloaded'&&!window.foodCityMap.walk.active));
    await page.locator('#walk-entry').click();await page.waitForFunction(()=>window.foodCityMap.walk.active);await settle();
    const initial=await page.evaluate(()=>({walk:window.foodCityMap.walk.getStats(),caption:document.querySelector('#walk-caption').textContent,distance:document.querySelector('#walk-distance').textContent,markers:document.querySelectorAll('.walk-endpoint').length,cards:[...document.querySelectorAll('.food-card')].map(e=>e.classList.contains('is-collapsed')),eligible:window.foodCityMap.food.records.map(r=>r.routeEligible),rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length}));
    check('Road trial renders 50 segments, about 1.07 km and two road endpoints',initial.walk.segments===50&&initial.walk.distanceMetres>1060&&initial.walk.distanceMetres<1080&&initial.distance.includes('1.07')&&initial.markers===2&&initial.rendered>0,initial);
    check('Food candidates stay collapsed and ineligible for routing',initial.cards.length===2&&initial.cards.every(Boolean)&&initial.eligible.every(x=>x===false)&&initial.walk.entrancesConnected===false&&initial.caption.includes('未接门店入口'),initial);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/walk-qa-1440.png'});
    await page.locator('#walk-info').click();
    const sourceInfo=await page.locator('#walk-dialog').evaluate(e=>({open:e.open,text:e.textContent,links:[...e.querySelectorAll('#walk-legs a')].map(a=>({href:a.href,rel:a.rel,target:a.target}))}));
    check('Info shows eleven OSM way sources and clear entrance/length limits',sourceInfo.open&&sourceInfo.links.length===11&&sourceInfo.links.every(a=>/^https:\/\/www\.openstreetmap\.org\/way\/\d+$/.test(a.href)&&a.target==='_blank'&&a.rel.includes('noopener'))&&sourceInfo.text.includes('不提供到店导航')&&sourceInfo.text.includes('二维长度'),sourceInfo);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/walk-qa-info.png'});
    await page.locator('#walk-strict').check();await settle();
    const strict=await page.evaluate(()=>({walk:window.foodCityMap.walk.getStats(),caption:document.querySelector('#walk-caption').textContent,distance:document.querySelector('#walk-distance').textContent,rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length,legs:document.querySelectorAll('#walk-legs li').length}));
    check('Pedestrian-only mode has no path, no rendered line and no fake fallback',strict.walk.pedestrianOnly&&!strict.walk.hasRoute&&strict.walk.segments===0&&strict.rendered===0&&strict.legs===0&&strict.distance==='暂未连通',strict);
    await page.locator('#walk-dialog-close').click();await page.locator('#walk-close').click();await page.locator('#walk-entry').click();await settle();
    const reopened=await page.evaluate(()=>({stats:window.foodCityMap.walk.getStats(),checked:document.querySelector('#walk-strict').checked,rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length}));
    check('Closing and reopening retains strict mode with no line',reopened.stats.pedestrianOnly&&reopened.checked&&!reopened.stats.hasRoute&&reopened.rendered===0,reopened);
    await page.locator('#walk-info').click();await page.locator('#walk-strict').uncheck();await page.locator('#walk-dialog-close').click();await settle();
    await page.locator('#walk-flat').click();await settle();
    const flat=await page.evaluate(()=>({pitch:window.foodCityMap.map.getPitch(),label:document.querySelector('#walk-flat').textContent,active:window.foodCityMap.walk.active,rendered:window.foodCityMap.map.queryRenderedFeatures({layers:['walk-trial-line']}).length}));
    check('Overview switches to flat map while keeping road trial',flat.pitch<.01&&flat.label==='立体'&&flat.active&&flat.rendered>0,flat);
    await page.locator('#walk-flat').click();await settle();
    const threeD=await page.evaluate(()=>({pitch:window.foodCityMap.map.getPitch(),label:document.querySelector('#walk-flat').textContent,active:window.foodCityMap.walk.active}));
    check('3D view restores pitch and retains trial',threeD.pitch>30&&threeD.label==='俯瞰'&&threeD.active,threeD);
    report.viewports=[];
    for(const [width,height] of [[390,844],[320,680],[736,414],[1440,960]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>window.foodCityMap.walk.show());await settle();
      const m=await metrics();report.viewports.push(m);
      check('Page and road panel fit '+width+'x'+height,m.scroll[0]===width&&m.scroll[1]===height&&m.panel.left>=0&&m.panel.top>=0&&m.panel.right<=width&&m.panel.bottom<=height,m);
      const panel=m.panel;
      check('Both endpoints remain on screen and clear of bottom panel '+width+'x'+height,m.endpoints.length===2&&m.endpoints.every(e=>e.left>=0&&e.right<=width&&e.top>=0&&e.bottom<=height&&(e.right<=panel.left||e.left>=panel.right||e.bottom<=panel.top||e.top>=panel.bottom)),m);
      await page.locator('#walk-info').click();const d=await metrics();
      check('Road info dialog fits '+width+'x'+height,d.dialogs.length===1&&d.dialogs.every(r=>r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height),d.dialogs);
      await page.locator('#walk-dialog-close').click();
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/walk-qa-'+width+'.png'});
    }
    await page.locator('#walk-close').click();await settle();
    const closed=await page.evaluate(()=>({active:window.foodCityMap.walk.active,markers:document.querySelectorAll('.walk-endpoint').length,panelHidden:document.querySelector('#walk-panel').hidden,lineVisibility:window.foodCityMap.map.getLayoutProperty('walk-trial-line','visibility'),compact:window.foodCityMap.food.overlay.compact,expanded:document.querySelectorAll('.food-card:not(.is-collapsed)').length,foodActive:window.foodCityMap.food.active}));
    check('Close removes trial endpoints and restores food card layout',!closed.active&&closed.markers===0&&closed.panelHidden&&closed.lineVisibility==='none'&&closed.compact===false&&closed.expanded>0&&closed.foodActive,closed);
    const external=requests.filter(u=>/^https?:/.test(u)&&new URL(u).origin!=='http://127.0.0.1:8791'),failed=responses.filter(r=>r.status>=400);
    report.network={external,failed,walkRequests:requests.filter(u=>u.includes('walk-network'))};
    check('Normal runtime has no external requests, failed HTTP or browser errors',external.length===0&&failed.length===0&&report.pageErrors.length===0&&report.consoleErrors.length===0,report.network);
  }catch(e){report.issues.push('Execution error: '+e.message);}
  report.passed=report.issues.length===0;return report;
}
