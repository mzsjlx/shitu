async page=>{
  const report={date:'2026-10-23',scope:'Final visual regression only: 818/1440 overview renders real source 3D buildings below the old zoom-15 gate; 2D visibility; exact HTTP-served standalone preview.html with no auxiliary HTTP requests. No interaction suite repeated.',checks:[],issues:[],views:[],pageErrors:[],standaloneRequests:[]};
  const context=await page.context().browser().newContext({viewport:{width:818,height:871},reducedMotion:'reduce'}),qa=await context.newPage();qa.on('pageerror',error=>report.pageErrors.push(error.message));
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active,undefined,{timeout:25000});
  const settle=async p=>{await p.waitForFunction(()=>{const map=window.foodCityMap?.map;return map&&!map.isMoving()&&map.isSourceLoaded('city')&&map.areTilesLoaded();},undefined,{timeout:20000});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));};
  const buildings=p=>p.evaluate(()=>{const map=window.foodCityMap.map;return {viewport:[innerWidth,innerHeight],zoom:map.getZoom(),pitch:map.getPitch(),threeDVisibility:map.getLayoutProperty('buildings-3d','visibility'),flatVisibility:map.getLayoutProperty('buildings-flat','visibility'),threeDMinzoom:map.getLayer('buildings-3d').minzoom,flatMinzoom:map.getLayer('buildings-flat').minzoom,rendered3D:map.queryRenderedFeatures({layers:['buildings-3d']}).length,renderedFlat:map.queryRenderedFeatures({layers:['buildings-flat']}).length,wants:[...window.foodCityMap.food.saved]};});
  try{
    await qa.goto('http://127.0.0.1:8791/?view=food');await ready(qa);await settle(qa);const ids=await qa.evaluate(()=>window.foodCityMap.food.records.map(item=>item.id));
    for(const id of ids){await qa.locator('.food-card[data-food-id="'+id+'"]').click();await qa.locator('#food-save').click();await qa.locator('#food-close').click();}
    for(const [width,height]of [[818,871],[1440,960]]){
      await qa.setViewportSize({width,height});await qa.locator('#trip-overview').click();await settle(qa);const view=await buildings(qa);report.views.push(view);
      check('Final '+width+' overview renders source 3D buildings with positive pitch and two wants',view.pitch>0&&view.rendered3D>0&&view.threeDVisibility==='visible'&&view.flatVisibility==='none'&&view.wants.length===2,view);
      check('Final '+width+' 3D building layer begins at zoom 13 like the flat layer',view.threeDMinzoom===13&&view.flatMinzoom===13,{threeD:view.threeDMinzoom,flat:view.flatMinzoom});
      await qa.screenshot({path:'D:/codex/美食网站/output/playwright/trip-qa-final-'+width+'.png'});
    }
    await qa.locator('#view-2d').click();await settle(qa);const flat=await buildings(qa);report.views.push(flat);
    check('2D button hides extrusion and renders the flat building layer',flat.pitch<.1&&flat.threeDVisibility==='none'&&flat.flatVisibility==='visible'&&flat.rendered3D===0&&flat.renderedFlat>0,flat);
    const standalone=await context.newPage();standalone.on('pageerror',error=>report.pageErrors.push('standalone: '+error.message));standalone.on('request',request=>{if(/^https?:/.test(request.url()))report.standaloneRequests.push(request.url());});await standalone.setViewportSize({width:818,height:871});
    await standalone.goto('http://127.0.0.1:8791/preview.html?view=food');await ready(standalone);await standalone.locator('#trip-overview').click();await settle(standalone);const solo=await buildings(standalone);report.standaloneView=solo;
    check('Exact HTTP standalone food overview also renders source 3D buildings',solo.pitch>0&&solo.rendered3D>0&&solo.threeDMinzoom===13&&solo.wants.length===2,solo);
    check('Standalone makes no auxiliary HTTP requests beyond the original HTML',report.standaloneRequests.length===1&&new URL(report.standaloneRequests[0]).pathname==='/preview.html',report.standaloneRequests);
    check('Final ordinary and standalone visual checks emit no page errors',report.pageErrors.length===0,report.pageErrors);
  }catch(error){report.issues.push('Execution error: '+error.message);report.executionStack=error.stack;}
  finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
