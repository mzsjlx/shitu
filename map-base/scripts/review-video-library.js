async page=>{
  const base='http://127.0.0.1:8791',root='D:/codex/美食网站/',browser=page.context().browser();
  const data=await(await page.request.get(base+'/data/video-library.json')).json();
  const report={date:'2026-10-27',scope:'Isolated local Chromium; real MP4 decoding, HTTP ranges, dialog media lifecycle, responsive layouts, missing assets and data failures. No real user storage, external platform playback or geographic verification.',checks:[],errors:[],externalRequests:[],media:[]};
  const check=(name,passed,detail)=>report.checks.push({name,passed:!!passed,detail});
  async function run(name,body){
    const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async route=>{report.externalRequests.push(route.request().url());await route.abort();});
    const p=await context.newPage();p.on('pageerror',e=>report.errors.push(name+': '+e.message));
    try{await body(p,context);}catch(e){check(name+' completes',false,e.message);await p.screenshot({path:root+'output/playwright/video-library-failure.png'}).catch(()=>{});}
    finally{await context.close();}
  }
  const loaded=p=>p.waitForFunction(()=>document.getElementById('video-library-grid')?.children.length===11,undefined,{timeout:15000});
  const foodReady=p=>p.waitForFunction(()=>window.foodCityMap?.ready&&window.foodCityMap?.food?.active,undefined,{timeout:30000});
  await run('Real local media',async p=>{
    const response=await p.goto(base+'/?view=food&videos=1');await loaded(p);await foodReady(p);
    check('Deep link opens map-backed modal and 11 first-author cards',response.status()===200&&await p.locator('#video-library-dialog').evaluate(d=>d.open)&&await p.locator('.video-clip-card').count()===11);
    check('Twenty clips and their approximate map places are available',await p.locator('#video-library-status').textContent()==='20 个本地片段 · 已加入地图，位置大致'&&await p.evaluate(()=>window.foodCityMap.getStats().foodCards)===20);
    for(const source of data.sources.filter(s=>s.segments.length)){
      await p.locator(`[data-source="${source.id}"]`).click();
      for(const segment of source.segments){
        await p.locator(`[data-clip="${segment.id}"]`).click();
        const search=p.locator('#video-library-player .video-map-search'),href=new URL(await search.getAttribute('href'));
        check(segment.id+' has a user-initiated city-limited map search for this store',href.origin==='https://uri.amap.com'&&href.pathname==='/search'&&href.searchParams.get('keyword')===segment.name&&href.searchParams.get('city')==='500000'&&await search.getAttribute('target')==='_blank'&&(await search.getAttribute('rel')).includes('noopener'));
        await p.waitForFunction(()=>{const v=document.querySelector('#video-library-player video');return v?.readyState>=2&&v.videoWidth>0;},undefined,{timeout:12000});
        const media=await p.locator('#video-library-player video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,error:v.error?.message||null,src:v.currentSrc}));
        report.media.push({id:segment.id,...media});
        check(segment.id+' decodes full portrait H.264/AAC media with expected duration',media.width===576&&media.height===1024&&!media.error&&Math.abs(media.duration-(segment.end-segment.start))<.16,media);
      }
    }
    const video=p.locator('#video-library-player video');
    const playback=await video.evaluate(async v=>{await v.play();return {initial:v.currentTime,paused:v.paused};});
    await p.waitForFunction(t=>document.querySelector('#video-library-player video')?.currentTime>t+.15,playback.initial,{timeout:7000});
    check('Selected video actually advances after play',!playback.paused);
    await video.evaluate(v=>{v.dataset.qaReference='old';window.__qaOldVideo=v;});
    await p.locator('[data-source="nangua"]').click();
    check('Changing author pauses and unloads the previous media',await p.evaluate(()=>window.__qaOldVideo.paused&&!window.__qaOldVideo.getAttribute('src')));
    await p.locator('#video-library-search').fill('罗汉寺');
    check('Address search finds the correct single-store card',await p.locator('.video-clip-card').count()===1&&await p.locator('.video-clip-card strong').textContent()==='三样子');
    await p.locator('#video-library-search').fill('没有这个店');check('Empty search has visible feedback',await p.locator('.video-clip-card').count()===0&&await p.locator('#video-library-message').isVisible());
    await p.locator('#video-library-search').fill('');await p.locator('[data-source="zhizhi"]').click();
    check('Unavailable third source never creates fictitious clips or a player',await p.locator('.video-clip-card').count()===0&&await p.locator('#video-library-player video').count()===0&&await p.locator('#video-library-player h3').textContent()==='原片待补充');
    check('Third original link targets the exact user-supplied work',await p.locator('#video-library-player .video-original-link').getAttribute('href')==='https://www.douyin.com/video/7653075066175338725');
    await p.locator('[data-source="nangua"]').click();await p.locator('[data-clip="nangua-nendouya"]').click();
    for(const [width,height]of [[1440,960],[390,844],[320,680],[736,414]]){
      await p.setViewportSize({width,height});
      const geometry=await p.evaluate(()=>{const d=document.getElementById('video-library-dialog'),b=d.querySelector('.video-library-body'),r=d.getBoundingClientRect();return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,dialog:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},horizontalOverflow:d.scrollWidth>d.clientWidth+1,bodyHorizontalOverflow:b.scrollWidth>b.clientWidth+1};});
      check('Dialog fits '+width+'×'+height,geometry.pageWidth===width&&geometry.dialog.left>=0&&geometry.dialog.right<=width&&geometry.dialog.top>=0&&geometry.dialog.bottom<=height&&!geometry.horizontalOverflow&&!geometry.bodyHorizontalOverflow,geometry);
      if(width<=700){await p.locator('#video-library-choose').click();const search=await p.locator('#video-library-search').boundingBox();check('Mobile change-shop action reveals search and cards at '+width,search&&search.y>0&&search.y+search.height<height,search);await p.locator('[data-clip="nangua-nendouya"]').click();}
      const search=p.locator('#video-library-player .video-map-search');await search.scrollIntoViewIfNeeded();const sr=await search.boundingBox();check('Map search remains reachable at '+width,sr&&sr.y>=0&&sr.y+sr.height<=height,sr);
      const link=p.locator('#video-library-player .video-original-link');await link.scrollIntoViewIfNeeded();const lr=await link.boundingBox();check('Player attribution remains reachable at '+width,lr&&lr.y>=0&&lr.y+lr.height<=height,lr);
      await p.locator('[data-source="abang"]').click();const card=p.locator('[data-clip="abang-yabatu"]');await card.scrollIntoViewIfNeeded();await card.click();check('Last card remains selectable at '+width,await p.locator('#video-library-player h3').textContent()==='哑巴兔');
      await p.locator('[data-source="nangua"]').click();await p.locator('[data-clip="nangua-nendouya"]').click();
      await p.locator('#video-library-player').evaluate(e=>e.scrollTop=0);await p.locator('.video-library-body').evaluate(e=>e.scrollTop=0);await p.locator('.video-library-browse').evaluate(e=>e.scrollTop=0);
      if(width===1440||width===390){await p.locator('#video-library-player .video-map-search').scrollIntoViewIfNeeded();await p.screenshot({path:root+'output/playwright/video-map-search-'+width+'.png'});}
    }
    await p.setViewportSize({width:1440,height:960});await p.locator('#video-library-player video').evaluate(async v=>{window.__qaOldVideo=v;await v.play();});
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('video-library-dialog').open&&window.__qaOldVideo.paused&&!window.__qaOldVideo.getAttribute('src'));check('Escape closes modal and stops hidden audio',true);
    await p.locator('#food-pick-open').click();await p.locator('#video-library-open').click();check('Existing food picker opens the library',await p.locator('#video-library-dialog').evaluate(d=>d.open));
    await p.locator('#video-library-close').click();check('Close returns focus to the map action',await p.locator('#video-library-open').evaluate(e=>e===document.activeElement));
    await p.locator('#food-pick-close').click();check('Existing map and source-candidate count survive media operations',await p.evaluate(()=>window.foodCityMap.ready&&window.foodCityMap.getStats().foodCards===20));
    const asset=(await(await p.request.get(base+'/data/video-library-assets.json')).json()).segments['nangua-jiachang'];
    const range=await p.request.get(base+'/'+asset.clip.slice(2),{headers:{Range:'bytes=0-1023'}});
    check('MP4 range requests use correct MIME, length and partial content',range.status()===206&&range.headers()['content-type']==='video/mp4'&&(await range.body()).length===1024&&range.headers()['content-range'].startsWith('bytes 0-1023/'),range.headers());
    const denied=await p.request.get(base+'/.local/video-intake/nangua/observed-media.json');check('Private acquisition records are not served',denied.status()===404);
  });
  await run('Lazy ordinary map',async p=>{const requested=[];p.on('request',r=>requested.push(r.url()));await p.goto(base+'/');await p.waitForFunction(()=>window.foodCityMap?.ready,undefined,{timeout:30000});check('Ordinary map does not request video metadata or media',!requested.some(u=>u.includes('video-library')||u.includes('/media/videos/')),requested.filter(u=>u.includes('video')));});
  await run('Missing media on another checkout',async(p,context)=>{await context.route('**/data/video-library-assets.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({schemaVersion:1,segments:{}})}));await p.goto(base+'/?view=food&videos=1');await loaded(p);check('Missing local media still exposes source addresses without broken images or players',await p.locator('.video-clip-card').count()===11&&await p.locator('.video-clip-card img,#video-library-player video').count()===0&&await p.locator('#video-library-player .video-original-link').getAttribute('href')===data.sources[0].url&&await p.locator('#video-library-status').textContent()==='原片片段未导入本机 · 可查看来源与地址线索');});
  await run('Data failure and retry',async(p,context)=>{let fail=true;await context.route('**/data/video-library.json',r=>fail?r.fulfill({status:503,body:'Unavailable'}):r.continue());await p.goto(base+'/?view=food&videos=1');await p.locator('#video-library-retry').waitFor({state:'visible'});check('Failed data fetch offers retry',await p.locator('#video-library-message').textContent()==='视频资料暂时未能读取，请重试。');fail=false;await p.locator('#video-library-retry').click();await loaded(p);check('Retry restores the real card library',await p.locator('.video-clip-card').count()===11);});
  check('All video shops have approximate locations and remain ineligible for navigation',data.sources.flatMap(s=>s.segments).every(s=>Array.isArray(s.coordinates)&&s.planningLocation?.accuracy==='approximate'&&s.routeEligible===false));
  check('No runtime page errors',report.errors.length===0,report.errors);check('No third-party prefetch or external requests',report.externalRequests.length===0,report.externalRequests);
  report.passed=report.checks.every(c=>c.passed);return report;
}
