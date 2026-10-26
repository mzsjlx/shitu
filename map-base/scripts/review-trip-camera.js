async page=>{
  const report={date:'2026-10-23',scope:'Targeted regression of measured-control fitPadding. Independent context with only the two existing source candidates; this is camera/layout verification, not entrance or route verification.',checks:[],issues:[],viewports:[],pageErrors:[]};
  const context=await page.context().browser().newContext({viewport:{width:818,height:871},reducedMotion:'reduce'}),qa=await context.newPage();qa.on('pageerror',error=>report.pageErrors.push(error.message));
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=()=>qa.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active);
  const settle=async()=>{await qa.waitForFunction(()=>{const map=window.foodCityMap?.map;return map&&!map.isMoving()&&map.isSourceLoaded('city')&&map.areTilesLoaded();},undefined,{timeout:20000});await qa.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));};
  const measure=()=>qa.evaluate(()=>{
    const map=window.foodCityMap.map,bounds=map.getContainer().getBoundingClientRect(),rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};};
    const visible=element=>element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden',overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
    const controls=[...document.querySelectorAll('.view-dock,#trip-dock,.maplibregl-ctrl-top-right,.maplibregl-ctrl-attrib,.about-map,.walk-tools,.street-tools,#road-info')].filter(visible).map(element=>({id:element.id,className:element.className,...rect(element)}));
    const points=window.foodCityMap.food.saved.map(id=>{const item=window.foodCityMap.food.records.find(item=>item.id===id),point=map.project(item.coordinates),card=document.querySelector('.food-card[data-food-id="'+id+'"]'),pin=rect(card.querySelector('.food-pin')),projected={left:point.x+bounds.left-7,top:point.y+bounds.top-7,right:point.x+bounds.left+7,bottom:point.y+bounds.top+7};return {id,projected,pin,collapsed:card.classList.contains('is-collapsed'),projectedInside:projected.left>=bounds.left&&projected.right<=bounds.right&&projected.top>=bounds.top&&projected.bottom<=bounds.bottom,pinInside:pin.left>=bounds.left&&pin.right<=bounds.right&&pin.top>=bounds.top&&pin.bottom<=bounds.bottom,projectedCovered:controls.filter(control=>overlap(projected,control)),pinCovered:controls.filter(control=>overlap(pin,control))};});
    const cards=[...document.querySelectorAll('.food-card:not(.is-collapsed)')].filter(visible).map(element=>({id:element.dataset.foodId,...rect(element)}));
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],pitch:map.getPitch(),bearing:map.getBearing(),padding:window.foodCityMap.food.fitPadding(),points,controls,expandedCards:cards,cardCovered:cards.flatMap(card=>controls.filter(control=>overlap(card,control)).map(control=>({card:card.id,control:control.id||control.className}))),dialogs:[...document.querySelectorAll('dialog[open]')].map(element=>({id:element.id,...rect(element)}))};
  });
  try{
    await qa.goto('http://127.0.0.1:8791/?view=food');await ready();await settle();
    const ids=await qa.evaluate(()=>window.foodCityMap.food.records.map(item=>item.id));
    for(const id of ids){await qa.locator('.food-card[data-food-id="'+id+'"]').click();await qa.locator('#food-save').click();await qa.locator('#food-close').click();}
    for(const [width,height]of [[818,871],[390,844],[320,680],[1440,960],[736,414]]){
      await qa.setViewportSize({width,height});await qa.locator('#view-3d').click();await qa.locator('#trip-overview').click();await settle();const m=await measure();report.viewports.push({kind:'three-dimensional',...m});
      check('Both real source points and visible pins stay in the map and clear controls at '+width+'×'+height,m.points.length===2&&m.points.every(p=>p.projectedInside&&p.pinInside&&p.projectedCovered.length===0&&p.pinCovered.length===0),m.points);
      check('Expanded cards avoid controls after overview at '+width+'×'+height,m.cardCovered.length===0,{expanded:m.expandedCards,covered:m.cardCovered});
      check('Page fits viewport after measured-padding overview at '+width+'×'+height,m.scroll[0]===width&&m.scroll[1]===height,m.scroll);
      if(width===818||width===1440)await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-camera-'+width+'.png'});
      await qa.locator('#trip-manage').click();const dialog=await measure();
      check('Sorting modal still fits after camera padding change at '+width+'×'+height,dialog.dialogs.length===1&&dialog.dialogs.every(r=>r.left>=-.5&&r.right<=width+.5&&r.top>=-.5&&r.bottom<=height+.5&&r.scrollWidth<=r.clientWidth+1),dialog.dialogs);await qa.locator('#wants-close').click();
      await qa.locator('#view-2d').click();await qa.locator('#trip-overview').click();await settle();const flat=await measure();report.viewports.push({kind:'two-dimensional',...flat});
      check('2D overview preserves pitch zero and both source positions at '+width+'×'+height,flat.pitch<.1&&await qa.locator('#view-2d').getAttribute('aria-pressed')==='true'&&flat.points.every(p=>p.projectedInside&&p.projectedCovered.length===0&&p.pinInside&&p.pinCovered.length===0),{pitch:flat.pitch,points:flat.points});
    }
    check('Targeted camera run has no browser runtime errors',report.pageErrors.length===0,report.pageErrors);
  }catch(error){report.issues.push('Execution error: '+error.message);report.executionStack=error.stack;try{await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-camera-failure.png'});}catch{}}
  finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
