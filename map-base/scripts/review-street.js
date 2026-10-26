async page => {
  const url='http://127.0.0.1:8791/';
  const report={date:'2026-10-21',scope:'HTTP browser street-detail QA; no real-world walkability claim',checks:[],issues:[],pageErrors:[],consoleErrors:[]};
  const requests=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const settle=async target=>{
    await target.waitForFunction(()=>{const a=window.foodCityMap;return a?.ready&&!a.map.isMoving()&&a.map.areTilesLoaded();},undefined,{timeout:20000});
    await target.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  };
  const metrics=target=>target.evaluate(()=>{
    const d=document.documentElement,box=e=>{const b=e.getBoundingClientRect();return [b.left,b.top,b.right,b.bottom];};
    return {viewport:[innerWidth,innerHeight],scroll:[d.scrollWidth,d.scrollHeight],tools:box(document.querySelector('.street-tools')),note:box(document.querySelector('#street-note')),dock:box(document.querySelector('.view-dock')),dialog:document.querySelector('#street-dialog').open?box(document.querySelector('#street-dialog')):null};
  });
  let failurePage;
  page.setDefaultTimeout(18000);
  try {
    await page.setViewportSize({width:1440,height:960});
    await page.goto(url);await settle(page);
    report.initial=await page.evaluate(()=>({base:window.foodCityMap.getStats(),street:window.foodCityMap.street.getStats(),height:window.foodCityMap.map.getPaintProperty('buildings-3d','fill-extrusion-height')}));
    check('city view leaves street data unloaded',report.initial.base.ready&&report.initial.street.phase==='unloaded'&&!requests.some(u=>u.endsWith('/street-detail.geojson')),report.initial.street);
    await page.locator('#street-entry').click();
    await page.waitForFunction(()=>window.foodCityMap.street.getStats().active);await settle(page);
    report.near=await page.evaluate(()=>{
      const a=window.foodCityMap,m=a.map,ids=['street-road-surface','street-lanes','street-walk','street-steps','street-crossing','street-zebra'];
      return {base:a.getStats(),street:a.street.getStats(),layers:Object.fromEntries(ids.map(id=>[id,m.queryRenderedFeatures({layers:[id]}).length])),height:m.getPaintProperty('buildings-3d','fill-extrusion-height')};
    });
    check('street entry loads once and activates real source records',report.near.base.ready&&report.near.street.phase==='loaded'&&report.near.street.visibleSourceFeatures>0&&requests.filter(u=>u.endsWith('/street-detail.geojson')).length===1,report.near);
    check('street camera renders road illustration and walking detail',report.near.layers['street-lanes']>0&&report.near.layers['street-walk']>0&&report.near.layers['street-crossing']>0,report.near.layers);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/street-qa-near.png'});
    const filtered=await page.evaluate(()=>{
      const m=window.foodCityMap.map,features=m.getSource('street-detail').serialize().data.features;
      const source=features.filter(f=>f.properties.type!=='lane-separator');
      const unsafe=source.filter(f=>{const p=f.properties;return p.restricted||p.isElevated||p.isUnderground||Number(p.layer||0)!==0||['private','no'].includes(p.access)||(p.type!=='raw-road'&&['private','no'].includes(p.foot));});
      const unknownZebras=m.queryRenderedFeatures({layers:['street-zebra']}).filter(f=>!f.properties.explicitlyZebra);
      return {sourceCount:source.length,unsafeCount:unsafe.length,unknownZebras:unknownZebras.length,zebraFilter:m.getFilter('street-zebra'),types:source.reduce((s,f)=>(s[f.properties.type]=(s[f.properties.type]||0)+1,s),{})};
    });
    check('restricted and grade-separated source records are excluded',filtered.sourceCount>0&&filtered.unsafeCount===0,filtered);
    check('zebra layer requires explicit source marking',filtered.unknownZebras===0&&JSON.stringify(filtered.zebraFilter).includes('explicitlyZebra'),filtered.zebraFilter);
    const screenPoint=await page.evaluate(()=>{
      const m=window.foodCityMap.map,r=m.getCanvas().getBoundingClientRect();
      for(let y=110;y<r.height-170;y+=16)for(let x=220;x<r.width-80;x+=16){
        if(m.queryRenderedFeatures([x,y],{layers:['street-walk','street-crossing']}).length)return {x:x+r.left,y:y+r.top};
      }
      return null;
    });
    if(screenPoint){
      await page.mouse.click(screenPoint.x,screenPoint.y);
      await page.locator('#road-info').waitFor({state:'visible'});
      const card=await page.locator('#road-info').innerText();
      check('clicking walking detail exposes original OSM way provenance',card.includes('OpenStreetMap')&&/way\/\d+/.test(card),{screenPoint,card});
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/street-qa-inspect.png'});
      await page.locator('#road-close').click();
    }else check('clicking walking detail exposes original OSM way provenance',false,'No unobscured walking-detail screen point found');
    await page.locator('#layers-toggle').click();
    await page.locator('#labels-option').uncheck();
    check('road-name toggle also hides street names',await page.evaluate(()=>window.foodCityMap.map.getLayoutProperty('street-names','visibility')==='none'));
    await page.locator('#street-option').uncheck();
    check('street toggle disables detail',await page.evaluate(()=>!window.foodCityMap.street.getStats().active&&window.foodCityMap.map.getLayoutProperty('street-walk','visibility')==='none'));
    await page.locator('#street-option').check();
    check('reenabling detail preserves disabled street labels',await page.evaluate(()=>window.foodCityMap.street.getStats().active&&window.foodCityMap.map.getLayoutProperty('street-names','visibility')==='none'));
    await page.locator('#labels-option').check();await page.locator('#layers-close').click();
    await page.locator('#street-info').click();await page.locator('#street-dialog').waitFor({state:'visible'});
    await page.keyboard.press('Escape');
    check('street explanation closes with Escape',!await page.locator('#street-dialog').isVisible());
    await page.locator('#reset-view').click();await settle(page);
    const reset=await page.evaluate(()=>({street:window.foodCityMap.street.getStats(),height:window.foodCityMap.map.getPaintProperty('buildings-3d','fill-extrusion-height')}));
    check('reset exits detail and restores source building height expression',!reset.street.active&&JSON.stringify(reset.height)===JSON.stringify(report.initial.height),reset);
    for(const [width,height] of [[390,844],[320,680]]){
      await page.setViewportSize({width,height});await page.locator('#street-entry').click();
      await page.waitForFunction(()=>window.foodCityMap.street.getStats().active);await settle(page);
      let layout=await metrics(page);
      const fits=b=>b[0]>=-.5&&b[2]<=width+.5&&b[1]>=0&&b[3]<=height+.5;
      check(width+'px near view remains within viewport',layout.scroll[0]===width&&layout.scroll[1]===height&&fits(layout.tools)&&fits(layout.note)&&fits(layout.dock),layout);
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/street-qa-'+width+'.png'});
      await page.locator('#street-info').click();layout=await metrics(page);
      check(width+'px explanation fits viewport',fits(layout.dialog),layout.dialog);
      await page.keyboard.press('Escape');
    }
    check('repeated near entry reuses loaded data',requests.filter(u=>u.endsWith('/street-detail.geojson')).length===1,{streetRequests:requests.filter(u=>u.endsWith('/street-detail.geojson')).length});
    failurePage=await page.context().newPage();failurePage.setDefaultTimeout(18000);
    let failedRequests=0;
    await failurePage.route('**/data/street-detail.geojson',route=>{failedRequests++;return route.abort('failed');});
    await failurePage.goto(url);await settle(failurePage);await failurePage.locator('#street-entry').click();
    await failurePage.waitForFunction(()=>window.foodCityMap.street.getStats().phase==='error');
    const failure=await failurePage.evaluate(()=>({base:window.foodCityMap.ready,loadingHidden:document.querySelector('#loading').hidden,errorHidden:document.querySelector('#map-error').hidden,entry:document.querySelector('#street-entry').textContent,note:document.querySelector('#street-note').textContent}));
    check('street data failure preserves base and provides retry',failure.base&&failure.loadingHidden&&failure.errorHidden&&failure.entry.includes('重试'),failure);
    await failurePage.unroute('**/data/street-detail.geojson');
    let pendingRequests=0;
    await failurePage.route('**/data/street-detail.geojson',async route=>{pendingRequests++;await new Promise(r=>setTimeout(r,250));await route.continue();});
    await failurePage.evaluate(()=>Promise.all([window.foodCityMap.street.focus(),window.foodCityMap.street.focus(),window.foodCityMap.street.focus()]));
    await failurePage.waitForFunction(()=>window.foodCityMap.street.getStats().active);await settle(failurePage);
    check('retry succeeds and concurrent requests share one load',pendingRequests===1&&await failurePage.evaluate(()=>window.foodCityMap.ready&&window.foodCityMap.street.getStats().phase==='loaded'),{failedRequests,pendingRequests});
  }catch(error){report.issues.push('QA execution error: '+error.message);}
  finally{if(failurePage)await failurePage.close();}
  check('normal street interactions emit no page or console errors',report.pageErrors.length===0&&report.consoleErrors.length===0,{pageErrors:report.pageErrors,consoleErrors:report.consoleErrors});
  report.passed=report.issues.length===0;
  return report;
}
