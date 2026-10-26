async page=>{
  const report={date:'2026-10-23',scope:'Independent browser context. Actual controls and synthetic local storage fixtures only; no verified entrance or navigable food route is asserted.',checks:[],issues:[],pageErrors:[],consoleErrors:[],viewports:[]};
  const key='foodcity:wants:chongqing:v1',base='http://127.0.0.1:8791/?view=food';
  const context=await page.context().browser().newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const qa=await context.newPage();
  qa.on('pageerror',error=>report.pageErrors.push(error.message));qa.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=()=>qa.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active&&window.foodCityMap.food.phase==='loaded',undefined,{timeout:25000});
  const settle=async()=>{await qa.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving(),undefined,{timeout:20000});await qa.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
  const saved=()=>qa.evaluate(()=>window.foodCityMap.food.getStats().saved);
  const rows=()=>qa.locator('#wants-list li.trip-row');
  const row=id=>qa.locator('#wants-list li.trip-row[data-saved-id="'+id+'"]');
  const dockIDs=()=>qa.locator('#trip-stops .trip-stop').evaluateAll(elements=>elements.map(element=>element.dataset.savedId));
  const rowIDs=()=>rows().evaluateAll(elements=>elements.map(element=>element.dataset.savedId));
  const active=()=>qa.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,classes:document.activeElement?.className,row:document.activeElement?.closest('[data-saved-id]')?.dataset.savedId}));
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const metrics=()=>qa.evaluate(()=>{
    const rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};};
    const visible=element=>!!element&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden';
    const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const dock=document.querySelector('#trip-dock'),dockRect=rect(dock);
    const controls=[...document.querySelectorAll('.view-dock,.maplibregl-ctrl-top-right,.maplibregl-ctrl-attrib,.about-map')].filter(visible).map(element=>({className:element.className,...rect(element)}));
    const expanded=[...document.querySelectorAll('.food-card:not(.is-collapsed)')].filter(visible).map(element=>({id:element.dataset.foodId,...rect(element)}));
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],dock:dockRect,dockVisible:visible(dock),controls,controlOverlap:controls.filter(control=>overlaps(dockRect,control)),expandedCards:expanded,cardOverlap:expanded.filter(card=>overlaps(dockRect,card)),dialogs:[...document.querySelectorAll('dialog[open]')].map(element=>({id:element.id,...rect(element)})),outsideControls:[...document.querySelectorAll('.topbar button,.topbar a,#trip-dock button,.view-dock button')].filter(visible).map(element=>({id:element.id,...rect(element)})).filter(r=>r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)};
  });
  try{
    await qa.goto(base);await ready();await settle();
    const records=await qa.evaluate(()=>window.foodCityMap.food.records.map(item=>({id:item.id,name:item.name})));report.records=records;
    if(records.length!==2)throw new Error('Expected the two current source candidates, got '+records.length);
    const [a,b]=records.map(item=>item.id);
    check('Fresh isolated browser has an empty wants list and helpful dock state',equal(await saved(),[])&&await qa.locator('#trip-dock').isVisible()&&await qa.locator('#trip-stops .trip-stop').count()===0);
    await qa.locator('#trip-open').click();
    check('Empty list opens from dock without a fake route action',await qa.locator('#wants-empty').isVisible()&&!await qa.locator('#trip-map-all').isVisible()&&await rows().count()===0);
    await qa.locator('#wants-close').click();check('Closing empty list returns focus to its dock trigger',(await active()).id==='trip-open',await active());
    for(const [index,id]of [a,b].entries()){
      await qa.locator('.food-card[data-food-id="'+id+'"]').click();await qa.locator('#food-save').click();
      check('Actual food detail adds candidate '+(index+1)+' and synchronizes the dock',equal(await saved(),[a,b].slice(0,index+1))&&equal(await dockIDs(),[a,b].slice(0,index+1))&&await qa.locator('#food-save').getAttribute('aria-pressed')==='true');
      await qa.locator('#food-close').click();
    }
    check('Two wants still have no generated food route, distance or ETA',await qa.evaluate(()=>!window.foodCityMap.map.getSource('walk-trial')&&!/\d\s*(公里|分钟|km|min)/i.test(document.querySelector('#trip-dock').textContent)&&window.foodCityMap.food.records.every(item=>item.routeEligible===false&&item.verificationStatus==='source-record')));
    await qa.locator('#trip-manage').click();
    check('Management dialog preserves append order and marks sorting boundaries',equal(await rowIDs(),[a,b])&&await row(a).locator('.trip-up').isDisabled()&&await row(b).locator('.trip-down').isDisabled());
    await row(b).locator('.trip-up').focus();await qa.keyboard.press('Enter');
    const movedFocus=await active();
    check('Keyboard Enter reorders both list and dock without losing focus',equal(await rowIDs(),[b,a])&&equal(await dockIDs(),[b,a])&&movedFocus.row===b,movedFocus);
    check('New sorting boundaries disable the correct actions',await row(b).locator('.trip-up').isDisabled()&&await row(a).locator('.trip-down').isDisabled());
    check('Reordering announces the new position',/第\s*1\s*站/.test(await qa.locator('#status').textContent()));
    const beforeDetail=await rowIDs();await row(b).locator('.want-item').click();
    check('Detail stacks above management without replacing the order',await qa.locator('#food-dialog').evaluate(element=>element.open)&&await qa.locator('#wants-dialog').evaluate(element=>element.open)&&equal(await rowIDs(),beforeDetail));
    await qa.locator('#food-close').click();
    check('Closing stacked detail returns focus to the same row',(await active()).row===b&&(await active()).classes.includes('want-item'),await active());
    await qa.locator('#wants-close').click();check('Closing manage returns focus to actual manage trigger',(await active()).id==='trip-manage',await active());
    await qa.reload();await ready();await settle();
    check('Sorted order survives reload using the original string-array storage key',equal(await saved(),[b,a])&&equal(await dockIDs(),[b,a])&&equal(await qa.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),[b,a]));
    await qa.evaluate(({key,a,b})=>localStorage.setItem(key,JSON.stringify([b,b,'synthetic-unknown-food-id',null,3,a,a])),{key,a,b});
    await qa.reload();await ready();await settle();
    check('Legacy duplicate IDs and unknown non-record entries cannot create duplicate stops',equal(await saved(),[b,a])&&equal(await dockIDs(),[b,a]));
    await qa.locator('#view-2d').click();await settle();const pitch2D=await qa.evaluate(()=>window.foodCityMap.map.getPitch());
    await qa.locator('#trip-open').click();await row(a).locator('.trip-up').click();
    check('Sorting in 2D preserves pitch and selected view',pitch2D<.1&&await qa.evaluate(()=>window.foodCityMap.map.getPitch()<.1)&&await qa.locator('#view-2d').getAttribute('aria-pressed')==='true');
    await row(a).locator('.trip-locate').click();await settle();
    check('Locating a stop closes management and preserves 2D',!await qa.locator('#wants-dialog').evaluate(element=>element.open)&&await qa.evaluate(()=>window.foodCityMap.map.getPitch()<.1)&&await qa.locator('#view-2d').getAttribute('aria-pressed')==='true');
    await qa.locator('#trip-overview').click();await settle();
    check('Overview of saved positions also preserves 2D without generating a route',await qa.evaluate(()=>window.foodCityMap.map.getPitch()<.1&&!window.foodCityMap.map.getSource('walk-trial')));
    await qa.locator('#trip-stops .trip-stop').first().click();await settle();
    check('Clicking a dock stop locates the ordered candidate without opening detail',await qa.evaluate(()=>window.foodCityMap.food.selected?.id===window.foodCityMap.food.saved[0])&&!await qa.locator('#food-dialog').evaluate(element=>element.open));
    await qa.locator('#trip-open').click();await qa.locator('#wants-close').click();
    check('Closing list opened by dock title returns to that exact trigger',(await active()).id==='trip-open',await active());
    await qa.locator('#wants-open').click();await qa.locator('#wants-close').click();
    check('Closing list opened by header returns to header trigger',(await active()).id==='wants-open',await active());
    await qa.locator('#trip-overview').click();await settle();await qa.locator('#walk-entry').click();await qa.waitForFunction(()=>window.foodCityMap.walk.active);await settle();
    check('Road-trial mode hides the new trip dock as well as candidate cards',!await qa.locator('#trip-dock').isVisible()&&await qa.locator('#walk-panel').isVisible()&&await qa.evaluate(()=>[...document.querySelectorAll('.food-card')].every(element=>getComputedStyle(element).visibility==='hidden')));
    await qa.locator('#walk-close').click();await settle();
    check('Closing independent road trial restores ordered dock',await qa.locator('#trip-dock').isVisible()&&equal(await dockIDs(),[a,b]));
    await qa.locator('#trip-manage').click();await row(a).locator('.trip-remove').click();
    const removeFocus=await active();
    check('Removing first stop synchronizes storage and dock and focuses its neighbor',equal(await saved(),[b])&&equal(await dockIDs(),[b])&&removeFocus.row===b,removeFocus);
    await row(b).locator('.trip-remove').click();
    check('Removing final stop leaves a usable empty state and close focus',equal(await saved(),[])&&await qa.locator('#wants-empty').isVisible()&&(await active()).id==='wants-close',await active());
    await qa.locator('#wants-close').click();
    check('Removed manage opener falls back to a visible focus target',await qa.evaluate(()=>document.activeElement?.getClientRects().length>0),await active());
    // Return to two real source records through the same public detail controls.
    await qa.locator('#food-entry').click();await qa.locator('#food-entry').click();await ready();await settle();
    for(const id of [a,b]){await qa.locator('.food-card[data-food-id="'+id+'"]').click();await qa.locator('#food-save').click();await qa.locator('#food-close').click();}
    await qa.locator('#view-3d').click();await qa.locator('#trip-overview').click();await settle();
    for(const [width,height]of [[1440,960],[390,844],[320,680],[736,414]]){
      await qa.setViewportSize({width,height});await qa.locator('#trip-overview').click();await settle();const mapMetrics=await metrics();report.viewports.push({kind:'map',...mapMetrics});
      check('Map and dock fit '+width+'×'+height+' without overflowing viewport',mapMetrics.scroll[0]===width&&mapMetrics.scroll[1]===height&&mapMetrics.dockVisible&&mapMetrics.dock.left>=-.5&&mapMetrics.dock.right<=width+.5&&mapMetrics.dock.top>=-.5&&mapMetrics.dock.bottom<=height+.5&&mapMetrics.outsideControls.length===0,mapMetrics);
      check('Dock avoids view/attribution controls and expanded cards at '+width+'×'+height,mapMetrics.controlOverlap.length===0&&mapMetrics.cardOverlap.length===0,{controls:mapMetrics.controlOverlap,cards:mapMetrics.cardOverlap});
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-map-'+width+'.png'});
      await qa.locator('#trip-manage').click();const dialogMetrics=await metrics();report.viewports.push({kind:'dialog',...dialogMetrics});
      check('Sorting dialog stays within '+width+'×'+height+' with no horizontal content overflow',dialogMetrics.dialogs.length===1&&dialogMetrics.dialogs.every(r=>r.left>=-.5&&r.right<=width+.5&&r.top>=-.5&&r.bottom<=height+.5&&r.scrollWidth<=r.clientWidth+1),dialogMetrics.dialogs);
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-dialog-'+width+'.png'});await qa.locator('#wants-close').click();
    }
    check('Browser flow emits no runtime or console errors',report.pageErrors.length===0&&report.consoleErrors.length===0,{pageErrors:report.pageErrors,consoleErrors:report.consoleErrors});
  }catch(error){report.issues.push('Execution error: '+error.message);report.executionStack=error.stack;try{await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-failure.png'});}catch{}}
  finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
