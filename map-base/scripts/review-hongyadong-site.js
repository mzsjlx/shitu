async page=>{
  const browser=page.context().browser(),base='http://127.0.0.1:8791',artifact='D:/codex/美食网站/output/playwright/';
  const report={date:'2026-10-26',scope:'Isolated site-fit and decorative planting checks. No new surveyed tree, floor or entrance claim. Source geography and public food files are verified separately.',checks:[],errors:[],consoleErrors:[],external:[]};
  const check=(name,passed,details)=>report.checks.push({name,passed:!!passed,details});
  const c=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),p=await c.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  await c.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async r=>{report.external.push(r.request().url());await r.abort();});
  const settle=async()=>{await p.waitForFunction(()=>window.foodCityMap?.landmark?.rendered&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded());await p.evaluate(()=>new Promise(r=>{const m=window.foodCityMap.map;m.once('idle',r);m.triggerRepaint();}));};
  const geometry=()=>p.evaluate(()=>{
    const f=window.foodCityMap,l=f.landmark,g=l.foundation,a=g.mesh.geometry.attributes.position.array,b=g.original;
    let changed=0,illegal=0,upward=0,nonfinite=0;
    for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i]))nonfinite++;if(a[i]!==b[i]){changed++;if(i%3!==1||Math.abs(b[i])>1e-6)illegal++;if(a[i]>b[i]+.0001)upward++;}}
    const hash=a=>{let h=2166136261;const bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(const x of bytes)h=Math.imul(h^x,16777619);return h>>>0;};
    return {stats:l.getStats(),changed,illegal,upward,nonfinite,stoneHash:hash(a),otherMeshes:l.group.children.filter(m=>m!==g.mesh).map(m=>({name:m.name,hash:hash(m.geometry.attributes.position.array)})),
      planting:l.planting.records.map((r,i)=>({id:r.id,mode:r.mode,point:r.point,roundtrip:r.point?l.toLngLat(r.x,r.z):null,base:l.planting.bases[i],dem:r.point?f.map.queryTerrainElevation(r.point):null,radius:r.radius,platform:r.platform})),
      memory:{...l.renderer.info.memory},programs:l.renderer.info.programs.map(x=>({runnable:x.diagnostics?.runnable??true})),labels:['landmarks','places'].map(id=>({id,visibility:f.map.getLayoutProperty(id,'visibility')}))};
  });
  try{
    await p.goto(base+'/?view=landmark');await settle();const initial=await geometry();report.initial=initial;
    const {stats}=initial,trees=initial.planting.filter(x=>x.mode==='terrain'),boxes=initial.planting.filter(x=>x.mode==='platform');
    check('Entry platform clears highest front DEM by 0.65m',Math.abs(stats.elevationMetres+9.6-Math.max(...stats.groundSampleElevations)-.65)<1e-6,stats.siteFit);
    check('Foundation only extends original stone bottom vertices downward',initial.changed>0&&initial.illegal===0&&initial.upward===0&&initial.nonfinite===0,{changed:initial.changed,illegal:initial.illegal,upward:initial.upward,minimum:stats.siteFit.lowestFoundationMetres});
    check('Twenty-two park trees retain precise WGS84 XY and terrain contact',trees.length===22&&trees.every(r=>r.roundtrip.every((n,i)=>Math.abs(n-r.point[i])<1e-10)&&Number.isFinite(r.dem)&&Math.abs(r.base+stats.elevationMetres-r.dem)<.0001),trees);
    check('Seven small terrace boxes stay at authored platform height',boxes.length===7&&boxes.every(r=>r.base===9.6&&r.radius<1),boxes);
    check('Vegetation adds two batches within geometry budget',stats.lastRender.calls===10&&stats.lastRender.triangles<=160000&&stats.planting.drawCalls===2&&stats.planting.pendingTerrain===0,stats.lastRender);
    check('Opaque city geometry and masonry shaders compile without errors',initial.programs.every(r=>r.runnable)&&await p.evaluate(()=>window.foodCityMap.map.getPaintProperty('buildings-3d','fill-extrusion-opacity')===1),{programs:initial.programs,memory:initial.memory});
    check('Landmark focus removes duplicate POI and neighbourhood labels',initial.labels.every(r=>r.visibility==='none'),initial.labels);
    await p.screenshot({path:artifact+'hongyadong-site-1440.png'});
    const count=stats.draws;await p.waitForTimeout(1000);check('Grounding and planting do not animate an idle map',await p.evaluate(n=>window.foodCityMap.landmark.draws-n<=2,count));
    await p.locator('#layers-toggle').click();await p.locator('#terrain-option').uncheck();await p.locator('#layers-close').click();await settle();const flat=await geometry();
    check('Flat mode restores every original stone vertex exactly',flat.changed===0&&flat.stats.elevationMetres===0&&flat.stats.siteFit.lowestFoundationMetres===0,{changed:flat.changed,site:flat.stats.siteFit});
    check('Flat mode grounds park trees while preserving terrace offsets',flat.planting.every(r=>r.base===(r.mode==='terrain'?0:9.6)),flat.planting.map(r=>({id:r.id,base:r.base})));
    check('Roof and timber vertices do not deform when fitting terrain',JSON.stringify(initial.otherMeshes)===JSON.stringify(flat.otherMeshes),initial.otherMeshes);
    await p.screenshot({path:artifact+'hongyadong-site-flat.png'});
    await p.locator('#layers-toggle').click();await p.locator('#terrain-option').check();await p.locator('#layers-close').click();await settle();const restored=await geometry();
    check('Re-enabling terrain restores the same foundation geometry',restored.stoneHash===initial.stoneHash&&Math.abs(restored.stats.elevationMetres-stats.elevationMetres)<.0001,{before:initial.stoneHash,after:restored.stoneHash});
    await p.evaluate(()=>window.foodCityMap.map.jumpTo({center:[106.5747,29.56495],zoom:17.3,pitch:62,bearing:142}));await settle();await p.screenshot({path:artifact+'hongyadong-site-park.png'});
    for(const [w,h]of [[390,844],[320,680],[736,414]]){
      await p.setViewportSize({width:w,height:h});await p.locator('#layers-toggle').click();await p.locator('#landmark-entry').click();await settle();
      const s=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,stats:window.foodCityMap.landmark.getStats(),note:document.getElementById('landmark-note').getBoundingClientRect().toJSON()}));
      check('Fitted model and vegetation remain usable at '+w+'×'+h,s.width===s.scroll&&s.stats.rendered&&!s.stats.error&&s.stats.lastRender.calls===10&&s.note.x>=0&&s.note.right<=w,s);
      if(w===390)await p.screenshot({path:artifact+'hongyadong-site-390.png'});
    }
    await p.setViewportSize({width:1440,height:960});await p.locator('#reset-view').click();await p.waitForFunction(()=>!window.foodCityMap.map.isMoving());
    check('City reset restores source labels',await p.evaluate(()=>['landmarks','places'].every(id=>window.foodCityMap.map.getLayoutProperty(id,'visibility')==='visible')));
    check('No shader errors, uncaught exceptions or external requests',!report.errors.length&&!report.consoleErrors.length&&!report.external.length,{errors:report.errors,console:report.consoleErrors,external:report.external});
  }catch(e){check('Site QA completes',false,e.message);}finally{await c.close();}
  report.summary={passed:report.checks.filter(x=>x.passed).length,total:report.checks.length,failed:report.checks.filter(x=>!x.passed).length};return report;
}
