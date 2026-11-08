async page => {
  const base=new URL(page.url()).origin,checks=[],errors=[],exits=[];
  const check=(name,passed,detail)=>checks.push({name,passed:!!passed,...(detail===undefined?{}:{detail})});
  const ctx=await page.context().browser().newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('reviewCityExit',value=>exits.push(value));
  const ready=()=>p.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap.food?.active,undefined,{timeout:45000});
  const saved={};
  const stats=()=>p.evaluate(()=>window.foodCityMap.food.routePreview.getStats());
  const play=async()=>{await p.locator('.food-popover-play').click();await p.waitForFunction(()=>{const v=document.querySelector('.food-popover-media video');return v?.currentTime>.15&&v.videoWidth>0&&!v.paused;},undefined,{timeout:15000});};
  const show=async id=>{
    await p.evaluate(id=>window.foodCityMap.food.focusStops(id),id);
    await p.waitForFunction(()=>!window.foodCityMap.map.isMoving());
    await p.locator(`[data-food-id="${id}"] .food-open`).click({timeout:10000});
    await p.waitForTimeout(100);
    if(!await p.locator('.food-inline-popover').isVisible())await p.locator(`[data-food-id="${id}"] .food-open`).click();
  };
  try {
    await p.goto(base+'/?city=nanjing&view=food');await ready();
    check('Switcher lists all four cities',JSON.stringify(await p.locator('select[aria-label="切换城市"] option').allTextContents())===JSON.stringify(['重庆','长沙','柳州','南京']));
    for(const [city,name,count] of [['nanjing','南京',104],['chongqing','重庆',81],['changsha','长沙',71],['liuzhou','柳州',9]]){
      if(city!=='nanjing'){await p.locator('select[aria-label="切换城市"]').selectOption(city);await ready();}
      const state=await p.evaluate(()=>{const a=window.foodCityMap,f=a.food;return {city:f.cityId,name:a.city.name,count:f.records.length,saved:f.saved,tiles:a.city.tiles,failures:a.getStats().failures,records:f.records.slice(0,2).map(r=>({id:r.id,name:r.name}))};});
      check(city+' loads its own map, content and empty saved list',state.city===city&&state.name===name&&state.count===count&&state.saved.length===0&&state.failures.length===0,state);
      check(city+' road search uses city title',(await p.locator('#search-input').getAttribute('placeholder')).includes(name));
      check(city+' has no Chongqing landmark outside Chongqing',await p.evaluate(city=>city==='chongqing'||!window.foodCityMap.landmark,city));
      saved[city]=state.records.map(r=>r.id);
      await p.evaluate(ids=>{for(const id of ids)window.foodCityMap.food.toggleSave(id);},saved[city]);
      check(city+' defaults to direct distance',(await stats()).mode==='direct');
      await p.locator('[data-route-mode="road"]').click();
      await p.waitForFunction(()=>['ready','partial','error'].includes(window.foodCityMap.food.routePreview.phase),undefined,{timeout:45000});
      const route=await stats();check(city+' computes a real road route',route.phase==='ready'&&route.count===1&&route.total>0,route);
      await p.screenshot({path:`../output/research/nanjing/review-${city}-desktop-20261107.png`});
      await show(state.records[0].id);await play();
      check(city+' actual local video decodes and plays',await p.locator('.food-popover-media video').evaluate(v=>v.readyState>=2&&v.currentTime>0));
      await p.evaluate(city=>{const v=document.querySelector('.food-popover-media video');window.addEventListener('beforeunload',()=>window.reviewCityExit({city,paused:v.paused,cleared:!v.getAttribute('src')}),{once:true});},city);
    }
    // UI switching back must retain each city's own two saved places and road mode.
    for(const city of ['nanjing','chongqing','changsha','liuzhou','nanjing']){
      await p.locator('select[aria-label="切换城市"]').selectOption(city);await ready();
      const state=await p.evaluate(()=>({saved:window.foodCityMap.food.saved,mode:window.foodCityMap.food.routeMode}));
      check(city+' saved places and road mode survive city round trip',JSON.stringify(state.saved)===JSON.stringify(saved[city])&&state.mode==='road',state);
    }
    check('Switching cities stops and clears all four old video tracks',exits.length===4&&exits.every(x=>x.paused&&x.cleared),exits);
    const multi=await p.evaluate(()=>window.foodCityMap.food.records.find(r=>r.clips?.length===4)?.id);
    await show(multi);await play();await p.evaluate(()=>window.reviewOldVideo=document.querySelector('.food-popover-media video'));
    await p.locator('.food-popover-clip').nth(1).click();
    check('Changing creator stops and releases old track',await p.evaluate(()=>window.reviewOldVideo.paused&&!window.reviewOldVideo.getAttribute('src')));
    await play();await p.evaluate(()=>window.reviewOldVideo=document.querySelector('.food-popover-media video'));
    await p.locator('.food-popover-close').click();
    check('Closing popover stops old track',await p.evaluate(()=>window.reviewOldVideo.paused&&!window.reviewOldVideo.getAttribute('src')));
    for(const size of [{width:1440,height:960},{width:390,height:844},{width:320,height:680},{width:736,height:414}]){
      await p.setViewportSize(size);await show(multi);
      const box=await p.locator('.food-inline-popover').boundingBox(),media=await p.locator('.food-popover-media').boundingBox();
      check(`Nanjing popover fits ${size.width}x${size.height} with video >= two thirds`,box.x>=0&&box.y>=0&&box.x+box.width<=size.width+.5&&box.y+box.height<=size.height+.5&&media.height/box.height>=.66,{box,media,ratio:media.height/box.height});
      check(`No horizontal page overflow at ${size.width}`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await p.screenshot({path:`../output/research/nanjing/review-popover-${size.width}-20261107.png`});
      await p.locator('.food-popover-close').click();
    }
    await p.setViewportSize({width:390,height:844});
    await p.evaluate(()=>window.foodCityMap.videoLibrary.open(document.getElementById('food-entry'),'nj-gaolegao-wanli'));
    await p.waitForSelector('#video-library-grid .video-clip-card');
    const text=await p.locator('#video-library-dialog').innerText();
    check('Library uses corrected year and displays source price caution',text.includes('2022-03-04')&&text.includes('营业情况可能已变化'));
    const link=p.locator('#video-library-player a[href*="amap.com"]').first();
    check('Nanjing map search uses city code 320100',(await link.getAttribute('href')).includes('320100'));
    await p.screenshot({path:'../output/research/nanjing/review-library-mobile-20261107.png'});
    await p.locator('#video-library-close').click();
    for(const [city,name] of [['nanjing','南京'],['changsha','长沙'],['liuzhou','柳州'],['chongqing','重庆']]){
      for(const stem of ['videos','places']){
        const url=`/${stem}${city==='chongqing'?'':'-'+city}.html`,res=await p.request.get(base+url),html=await res.text();
        check(city+' '+stem+' page retains city and map link',res.ok()&&html.includes(name)&&html.includes('city='+city));
      }
    }
    await p.goto(base+'/places/video-nj-gaolegao-wanli.html');
    check('Nanjing place detail returns to its own city',(await p.locator('a:has-text("在地图上看这家")').getAttribute('href')).includes('city=nanjing'));
    await p.goto(base+'/preview-nanjing.html?view=food');await ready();
    check('Standalone Nanjing preview uses Nanjing map and 104 stops',await p.evaluate(()=>window.foodCityMap.food.cityId==='nanjing'&&window.foodCityMap.food.records.length===104));
  }catch(e){check('Complete browser flow',false,e.message);}
  finally{await ctx.close();}
  check('No uncaught browser errors',errors.length===0,errors);
  return {verifiedOn:'2026-11-07',scope:'Isolated browser; four cities, two-stop road samples, actual playback per city, creator/close/city audio teardown, saved-state isolation, Nanjing four viewports and generated pages. Simulated mobile, not physical devices.',checks,passed:checks.every(c=>c.passed)};
}
