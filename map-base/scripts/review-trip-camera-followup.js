async page=>{
  const report={date:'2026-10-23',scope:'After measured padding and anchor collision fixes: actual detail saves in empty 320 screen, then only 320×680 3D/2D and 736×414 2D rechecked. Expanded-card appearance also inspected at 818 and 1440.',checks:[],issues:[],views:[],pageErrors:[]};
  const context=await page.context().browser().newContext({viewport:{width:320,height:680},reducedMotion:'reduce'}),qa=await context.newPage();qa.on('pageerror',error=>report.pageErrors.push(error.message));
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=()=>qa.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active);
  const settle=async()=>{await qa.waitForFunction(()=>{const map=window.foodCityMap?.map;return map&&!map.isMoving()&&map.isSourceLoaded('city')&&map.areTilesLoaded();},undefined,{timeout:20000});await qa.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));};
  try{
    await qa.goto('http://127.0.0.1:8791/?view=food');await ready();await settle();const ids=await qa.evaluate(()=>window.foodCityMap.food.records.map(item=>item.id));
    for(const [index,id]of ids.entries()){await qa.locator('.food-card[data-food-id="'+id+'"]').click();await qa.locator('#food-save').click();check('Empty 320 screen allows real detail click and save for candidate '+(index+1),await qa.evaluate(id=>window.foodCityMap.food.saved.includes(id),id)&&await qa.locator('#food-save').getAttribute('aria-pressed')==='true');await qa.locator('#food-close').click();}
    for(const [width,height,threeD]of [[320,680,true],[320,680,false],[736,414,false]]){
      await qa.setViewportSize({width,height});await qa.locator(threeD?'#view-3d':'#view-2d').click();await qa.locator('#trip-overview').click();await settle();
      const m=await qa.evaluate(()=>{
        const map=window.foodCityMap.map,bounds=map.getContainer().getBoundingClientRect(),rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};},visible=element=>element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden',overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
        const controls=[...document.querySelectorAll('.view-dock,#trip-dock,.maplibregl-ctrl-top-right,.maplibregl-ctrl-attrib,.about-map,.walk-tools,.street-tools,#road-info')].filter(visible).map(element=>({id:element.id,className:element.className,...rect(element)})),cards=[...document.querySelectorAll('.food-card:not(.is-collapsed)')].filter(visible).map(element=>({id:element.dataset.foodId,...rect(element)}));
        const points=window.foodCityMap.food.saved.map(id=>{const item=window.foodCityMap.food.records.find(item=>item.id===id),point=map.project(item.coordinates),card=document.querySelector('.food-card[data-food-id="'+id+'"]'),pin=rect(card.querySelector('.food-pin')),projected={left:point.x+bounds.left-7,top:point.y+bounds.top-7,right:point.x+bounds.left+7,bottom:point.y+bounds.top+7};return {id,projected,pin,collapsed:card.classList.contains('is-collapsed'),projectedInside:projected.left>=bounds.left&&projected.right<=bounds.right&&projected.top>=bounds.top&&projected.bottom<=bounds.bottom,pinInside:pin.left>=bounds.left&&pin.right<=bounds.right&&pin.top>=bounds.top&&pin.bottom<=bounds.bottom,projectedCovered:controls.filter(control=>overlap(projected,control)),pinCovered:controls.filter(control=>overlap(pin,control)),coveredByOtherCards:cards.filter(other=>other.id!==id&&(overlap(projected,other)||overlap(pin,other)))};});
        return {viewport:[innerWidth,innerHeight],pitch:map.getPitch(),padding:window.foodCityMap.food.fitPadding(),points,controls,cards,cardCovered:cards.flatMap(card=>controls.filter(control=>overlap(card,control)).map(control=>({card:card.id,control:control.id||control.className})))};
      });report.views.push({threeD,...m});
      const pointClear=m.points.length===2&&m.points.every(p=>p.projectedInside&&p.pinInside&&p.projectedCovered.length===0&&p.pinCovered.length===0);
      check(threeD?'Both real source points and visible pins stay in the map and clear controls at '+width+'×'+height:'2D overview preserves pitch zero and both source positions at '+width+'×'+height,pointClear&&(threeD||(m.pitch<.1&&await qa.locator('#view-2d').getAttribute('aria-pressed')==='true')),m);
      check('No other expanded card hides a source point or visible pin in '+(threeD?'3D':'2D')+' at '+width+'×'+height,m.points.every(p=>p.coveredByOtherCards.length===0),m.points);
      check('Expanded cards avoid controls in '+(threeD?'3D':'2D')+' at '+width+'×'+height,m.cardCovered.length===0,m.cardCovered);
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-camera-followup-'+width+'-'+(threeD?'3d':'2d')+'.png'});
    }
    for(const [width,height]of [[818,871],[1440,960]]){
      await qa.setViewportSize({width,height});await qa.locator('#view-3d').click();await qa.locator('#trip-overview').click();await settle();
      const cards=await qa.locator('.food-card:not(.is-collapsed)').evaluateAll(elements=>elements.map(element=>({id:element.dataset.foodId,photoVisible:element.querySelector('.food-photo').getClientRects().length>0})));
      check('Full photo cards still expand at '+width+'×'+height,cards.length>=(width===818?1:2)&&cards.every(card=>card.photoVisible),cards);
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-camera-'+width+'.png'});
    }
    check('Targeted camera run has no browser runtime errors',report.pageErrors.length===0,report.pageErrors);
  }catch(error){report.issues.push('Execution error: '+error.message);}
  finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
