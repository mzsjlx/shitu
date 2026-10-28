async page=>{
  const base='http://127.0.0.1:8791',browser=page.context().browser();
  const library=await(await page.request.get(base+'/data/video-library.json')).json();
  const records=await(await page.request.get(base+'/data/food-records.json')).json();
  const report={scope:'Isolated browser; video coordinates used below are synthetic test fixtures only.',checks:[],errors:[],unexpectedExternal:[]};
  const check=(name,passed,detail)=>report.checks.push({name,passed:!!passed,detail});
  async function run(name,body,{synthetic=false,viewport={width:1440,height:960}}={}){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'}),external=[];
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async route=>{
      const url=route.request().url();external.push(url);
      if(url.startsWith('https://player.bilibili.com/player.html?'))await route.fulfill({contentType:'text/html',body:'<!doctype html><title>播放器测试</title><p>模拟播放器</p>'});
      else{report.unexpectedExternal.push(url);await route.abort();}
    });
    if(synthetic){
      const data=structuredClone(library),segments=data.sources.flatMap(source=>source.segments);
      segments.find(item=>item.id==='nangua-sanyangzi').coordinates=[106.5746,29.5639];
      segments.find(item=>item.id==='nangua-qianjiang').coordinates=[106.5822,29.5607];
      await context.route('**/data/video-library.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(data)}));
    }
    const p=await context.newPage();p.on('pageerror',error=>report.errors.push(name+': '+error.message));
    try{await body(p,context,external);}catch(error){check(name+' completes',false,error.message);}
    finally{await context.close();}
  }
  const ready=async p=>{await p.goto(base+'/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});};
  await run('Existing locations and route',async(p,context,external)=>{
    await ready(p);
    check('Two real source candidates appear with no video store pins',await p.locator('.food-card').count()===2&&await p.evaluate(()=>window.foodCityMap.food.records.length)===2);
    check('Map card credits the matching video creator and platform', (await p.locator('.food-open').first().textContent()).includes('来源：B站 · 杉田千紘_CHIICHAN'));
    await p.locator('.food-open').first().hover();await p.locator('.food-inline-popover').waitFor({state:'visible'});
    check('Hover opens a small map-adjacent preview with no external request',await p.locator('.food-inline-popover').isVisible()&&external.length===0&&!await p.locator('#food-dialog').evaluate(d=>d.open));
    await p.locator('.food-open').first().click({timeout:5000});
    check('Click adds the first stop without opening the large modal',await p.evaluate(()=>window.foodCityMap.food.saved.length)===1&&!await p.locator('#food-dialog').evaluate(d=>d.open));
    check('Video preview credits the source and flags the unconfirmed branch', (await p.locator('.food-popover-heading').textContent()).includes('来源：B站 · 杉田千紘_CHIICHAN') && (await p.locator('.food-popover-links').textContent()).includes('分店待核'));
    const popup=await p.locator('.food-inline-popover').boundingBox(),media=await p.locator('.food-popover-media').boundingBox();
    check('Preview media occupies at least two thirds of the popup',media.height/popup.height>=2/3,{popup,media});
    await p.locator('.food-popover-play').click({timeout:5000});const frame=p.locator('.food-popover-media iframe');await frame.waitFor();
    const url=new URL(await frame.getAttribute('src'));
    check('Related Bilibili player starts only after clicking play',url.hostname==='player.bilibili.com'&&url.searchParams.get('bvid')==='BV1AJ7S6sE8y'&&external.length>0);
    await p.locator('.food-open').nth(1).click({timeout:5000});
    check('Choosing the second card closes the previous player and connects both stops',await p.locator('.food-popover-media iframe').count()===0&&await p.evaluate(()=>window.foodCityMap.food.saved.length)===2&&await p.locator('.food-distance-badge').count()===1);
    const distance=await p.evaluate(()=>({metres:window.foodCityMap.food.routePreview.total,caption:document.getElementById('trip-dock-caption').textContent,source:window.foodCityMap.map.getSource('food-direct-preview').serialize().data}));
    check('Distance is labelled as a straight-line estimate',distance.metres>830&&distance.metres<850&&distance.caption.includes('直线')&&distance.source.features.length===1,distance);
    check('Nearby controls and search are simplified in food mode',!await p.locator('#road-search').isVisible()&&!await p.locator('.walk-tools').isVisible());
    await p.screenshot({path:'../output/playwright/inline-food-desktop-qa.png'});
    await p.locator('.food-popover-save').click({timeout:5000});
    check('Removing one place clears the connection',await p.locator('.food-distance-badge').count()===0&&await p.evaluate(()=>window.foodCityMap.food.saved.length)===1);
    await p.locator('#food-entry').click({timeout:5000});check('Leaving food mode closes the preview and hides the route',await p.locator('.food-inline-popover').isHidden()&&await p.locator('.food-distance-badge').count()===0);
  });
  await run('Video card from a test-only coordinate',async(p,context,external)=>{
    await ready(p);
    check('Synthetic positioned segments create local video cards',await p.locator('.food-card').count()===4);
    const card=p.locator('[data-food-id="video-nangua-sanyangzi"] .food-open');await card.click({timeout:5000});
    check('Video clip card credits Douyin and its creator', (await card.textContent()).includes('来源：抖音 · 南瓜小丸子呀🎃'));
    check('The card uses the matching original video poster',await card.locator('img').getAttribute('src').then(src=>src.includes('nangua-sanyangzi')));
    check('Video is not fetched before play',!(await p.evaluate(()=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('nangua-sanyangzi')&&entry.name.endsWith('.mp4')))));
    await p.locator('.food-popover-play').click({timeout:5000});const video=p.locator('.food-popover-media video');await video.waitFor();
    await p.waitForFunction(()=>{const v=document.querySelector('.food-popover-media video');return v?.readyState>=2&&v.videoWidth>0;},undefined,{timeout:15000});
    const playback=await video.evaluate(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,paused:v.paused,time:v.currentTime}));
    check('The matching local video plays inside the map popup',playback.src.includes('nangua-sanyangzi')&&playback.width===576&&playback.height===1024,playback);
    await p.waitForFunction(()=>document.querySelector('.food-popover-media video')?.currentTime>.1,undefined,{timeout:8000});
    check('Local video actually advances',true);
    await video.evaluate(v=>window.__oldInlineVideo=v);
    await p.locator('[data-food-id="video-nangua-qianjiang"] .food-open').click({timeout:5000});
    check('Switching cards stops and unloads the old video',await p.evaluate(()=>window.__oldInlineVideo.paused&&!window.__oldInlineVideo.getAttribute('src')));
    check('Adding two synthetic video stores draws a labelled connection',await p.locator('.food-distance-badge').count()===1&&(await p.locator('.food-distance-badge').textContent()).includes('直线'));
    check('No external platform is loaded by local video cards',external.length===0);
  },{synthetic:true});
  for(const [width,height]of [[390,844],[320,680],[736,414]])await run('Layout '+width,async p=>{
    await ready(p);await p.locator('.food-open').first().click({timeout:5000});
    const popup=await p.locator('.food-inline-popover').boundingBox(),shell=await p.locator('.map-shell').boundingBox(),media=await p.locator('.food-popover-media').boundingBox();
    check('Popup stays visible and media remains dominant at '+width,popup.x>=shell.x-1&&popup.y>=shell.y-1&&popup.x+popup.width<=shell.x+shell.width+1&&popup.y+popup.height<=shell.y+shell.height+1&&media.height/popup.height>=2/3,{popup,shell,media});
    if(width===390)await p.screenshot({path:'../output/playwright/inline-food-mobile-qa.png'});
  },{viewport:{width,height}});
  check('Production video data still has no invented coordinates',library.sources.flatMap(source=>source.segments).every(item=>item.coordinates===null&&item.routeEligible===false));
  check('No unexpected external requests',report.unexpectedExternal.length===0,report.unexpectedExternal);
  check('No page errors',report.errors.length===0,report.errors);
  report.passed=report.checks.every(item=>item.passed);return report;
}
