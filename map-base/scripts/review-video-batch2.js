async page=>{
  const browser=page.context().browser(),base='http://127.0.0.1:8791',checks=[],errors=[];
  const check=(name,passed,detail)=>checks.push({name,passed:!!passed,detail});
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  try{
    const catalog=await(await p.request.get(base+'/data/video-library.json')).json(),segments=catalog.sources.flatMap(s=>s.segments),mapCount=new Set(segments.filter(s=>s.coordinates).map(s=>s.placeId||s.id)).size;
    await p.goto(base+'/?view=food&place=video-bailong-gangzi');
    await p.waitForFunction(()=>window.foodCityMap?.food?.active&&document.querySelector('.food-inline-popover.is-shown'),undefined,{timeout:30000});
    const duplicates=await p.evaluate(()=>window.foodCityMap.food.records.filter(r=>r.clips.length>1).map(r=>({id:r.id,clips:r.clips.map(c=>c.id)})));
    check('Each of the two matched stores has one pin and two creator clips',duplicates.length===2&&duplicates.every(d=>d.clips.length===2)&&await p.locator('.food-card').count()===mapCount,duplicates);
    check('An old per-clip deep link resolves to the shared shop with the requested creator',(await p.locator('.food-inline-popover').innerText()).includes('白龙吃了又饿了')&&await p.locator('[data-food-id="video-bailong-gangzi"]').count()===0);
    await p.locator('.food-popover-play').click();await p.waitForFunction(()=>document.querySelector('.food-popover-media video')?.currentTime>.1,undefined,{timeout:12000});
    check('Shared-store popup plays the specific linked clip',await p.locator('.food-popover-media video').evaluate(v=>v.currentSrc.includes('bailong-gangzi')&&v.videoWidth>0));
    await p.evaluate(()=>window.__batchOldVideo=document.querySelector('.food-popover-media video'));
    await p.locator('.food-popover-clip').filter({hasText:'吃货老外铁蛋儿'}).click();
    check('Switching creator unloads previous audio and updates credit and original link',await p.evaluate(()=>window.__batchOldVideo.paused&&!window.__batchOldVideo.getAttribute('src'))&&(await p.locator('.food-popover-heading small').innerText()).includes('吃货老外铁蛋儿')&&await p.locator('.food-popover-links a').getAttribute('href')==='https://www.douyin.com/video/7606643552034049280');
    await p.locator('.food-popover-play').click();await p.waitForFunction(()=>document.querySelector('.food-popover-media video')?.currentTime>.1,undefined,{timeout:12000});
    check('Second creator plays the other clip at the same shop',await p.locator('.food-popover-media video').evaluate(v=>v.currentSrc.includes('tiedan-gangzi')));
    const add=p.locator('.food-popover-save');await add.click();check('Adding a shared shop creates only one route stop',(await p.evaluate(()=>window.foodCityMap.food.saved)).length===1);
    await p.locator('.food-popover-clip').filter({hasText:'白龙'}).click();check('Switching videos preserves the same saved stop',(await p.evaluate(()=>window.foodCityMap.food.saved)).length===1&&await p.locator('.food-popover-save').getAttribute('aria-pressed')==='true');
    await p.setViewportSize({width:390,height:844});
    await p.evaluate(()=>{const f=window.foodCityMap.food,item=f.records.find(r=>r.id==='video-tiedan-gangzi');f.focusStops(item.id);f.overlay.showPopover(item,true);});
    const box=await p.locator('.food-inline-popover').boundingBox(),media=await p.locator('.food-popover-media').boundingBox();
    check('Mobile multi-video popup fits and keeps at least two-thirds for media',box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844&&media.height/box.height>=2/3,{box,media});
    await p.screenshot({path:'../output/playwright/video-batch2-shared-mobile.png'});
    await p.setViewportSize({width:1440,height:960});
    await p.evaluate(()=>{const f=window.foodCityMap.food,item=f.records.find(r=>r.id==='video-manbei-hongjiuge');f.focusStops(item.id);f.overlay.showPopover(item,true);});
    const oldText=await p.locator('.food-inline-popover').innerText();
    check('The 2024 source keeps its date and operating-status note',oldText.includes('2024年')&&oldText.includes('营业情况待确认'));
    await p.locator('.food-popover-play').click();await p.waitForFunction(()=>document.querySelector('.food-popover-media video')?.currentTime>.1,undefined,{timeout:12000});
    check('Landscape source plays at its original aspect ratio',await p.locator('.food-popover-media video').evaluate(v=>v.videoWidth===1280&&v.videoHeight===720&&getComputedStyle(v).objectFit==='contain'));
    check('The Shapingba card sits in the newly expanded western area',await p.evaluate(()=>window.foodCityMap.food.records.find(r=>r.id==='video-manbei-hongjiuge').coordinates[0]<106.47));
    await p.screenshot({path:'../output/playwright/video-batch2-shapingba.png'});
    await p.goto(base+'/?view=food&videos=1&clip=yumo-hotpot');await p.waitForFunction(()=>document.querySelector('#video-library-player video')?.readyState>=2,undefined,{timeout:30000});
    check('Unidentified shop remains playable and does not get a made-up map point',await p.locator('#video-library-player h3').textContent()==='居民楼火锅（鱼某探店，店名待补）'&&await p.locator('#video-library-player .video-nearby-button').count()===0&&(await p.locator('#video-library-status').innerText()).includes('5 段位置待补'));
    await p.locator('[data-source="zhangxixi"]').click();check('Old street-food footage is labeled 2021 in the library',(await p.locator('#video-library-player').innerText()).includes('2021年视频'));
    const directory=await(await p.request.get(base+'/places.html')).text(),unlocated=await(await p.request.get(base+'/places/video-yumo-hotpot.html')).text();
    check('Directory groups matched clips and unlocated pages offer no false map link',directory.includes('2条同店视频')&&directory.includes(mapCount+' 个地图点')&&!unlocated.includes('在地图上看这家'));
  }catch(error){check('New batch browser flow completes',false,error.message)}finally{await context.close()}
  check('No runtime page errors',errors.length===0,errors);return {date:'2026-10-28',checks,passed:checks.every(c=>c.passed)};
}
