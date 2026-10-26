async page=>{
  const report={date:'2026-10-23',scope:'Targeted follow-up: actual detail remove/re-add plus four dock/dialog layouts in an independent browser context.',checks:[],issues:[],viewports:[]};
  const context=await page.context().browser().newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),qa=await context.newPage();
  const key='foodcity:wants:chongqing:v1',check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=()=>qa.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active);
  const settle=async()=>{await qa.waitForFunction(()=>!window.foodCityMap.map.isMoving());await qa.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
  const metrics=()=>qa.evaluate(()=>{
    const rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};};
    const visible=element=>!!element&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden';
    const overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const dock=document.querySelector('#trip-dock'),dockRect=rect(dock),controls=[...document.querySelectorAll('.view-dock,.maplibregl-ctrl-top-right,.maplibregl-ctrl-attrib,.about-map')].filter(visible).map(element=>({className:element.className,...rect(element)})),cards=[...document.querySelectorAll('.food-card:not(.is-collapsed)')].filter(visible).map(element=>({id:element.dataset.foodId,...rect(element)}));
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],dock:dockRect,dockVisible:visible(dock),controls,controlOverlap:controls.filter(control=>overlap(dockRect,control)),expandedCards:cards,cardOverlap:cards.filter(card=>overlap(dockRect,card)),dialogs:[...document.querySelectorAll('dialog[open]')].map(element=>({id:element.id,...rect(element)})),outsideControls:[...document.querySelectorAll('.topbar button,.topbar a,#trip-dock button,.view-dock button')].filter(visible).map(element=>({id:element.id,...rect(element)})).filter(r=>r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)};
  });
  try{
    await qa.goto('http://127.0.0.1:8791/?view=food');await ready();await settle();const ids=await qa.evaluate(()=>window.foodCityMap.food.records.map(item=>item.id));
    await qa.evaluate(({key,ids})=>localStorage.setItem(key,JSON.stringify(ids)),{key,ids});await qa.reload();await ready();await settle();
    const b=ids[1];await qa.locator('.food-card[data-food-id="'+b+'"]').click();await qa.locator('#food-save').click();
    check('Actual detail save toggle removes an existing stop and updates dock',await qa.locator('#food-save').getAttribute('aria-pressed')==='false'&&await qa.locator('#trip-stops .trip-stop').count()===1&&await qa.evaluate(id=>!window.foodCityMap.food.saved.includes(id),b));
    await qa.locator('#food-save').click();check('Actual detail save toggle can re-add the removed last stop',await qa.locator('#food-save').getAttribute('aria-pressed')==='true'&&await qa.locator('#trip-stops .trip-stop').count()===2&&await qa.evaluate(expected=>JSON.stringify(window.foodCityMap.food.saved)===JSON.stringify(expected),ids));await qa.locator('#food-close').click();
    for(const [width,height]of [[1440,960],[390,844],[320,680],[736,414]]){
      await qa.setViewportSize({width,height});await qa.locator('#trip-overview').click();await settle();const m=await metrics();report.viewports.push({kind:'map',...m});
      check('Map and dock fit '+width+'×'+height+' without overflowing viewport',m.scroll[0]===width&&m.scroll[1]===height&&m.dockVisible&&m.dock.left>=-.5&&m.dock.right<=width+.5&&m.dock.top>=-.5&&m.dock.bottom<=height+.5&&m.outsideControls.length===0,m);
      check('Dock avoids view/attribution controls and expanded cards at '+width+'×'+height,m.controlOverlap.length===0&&m.cardOverlap.length===0,{controls:m.controlOverlap,cards:m.cardOverlap});
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-map-'+width+'.png'});await qa.locator('#trip-manage').click();const d=await metrics();report.viewports.push({kind:'dialog',...d});
      check('Sorting dialog stays within '+width+'×'+height+' with no horizontal content overflow',d.dialogs.length===1&&d.dialogs.every(r=>r.left>=-.5&&r.right<=width+.5&&r.top>=-.5&&r.bottom<=height+.5&&r.scrollWidth<=r.clientWidth+1),d.dialogs);
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-dialog-'+width+'.png'});await qa.locator('#wants-close').click();
    }
  }catch(error){report.issues.push('Execution error: '+error.message);}
  finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
