async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8791',checks=[],errors=[];
 const check=(name,passed,detail)=>checks.push({name,passed:!!passed,detail});
 const catalog=await(await page.request.get(base+'/data/video-library.json')).json(),mapIds=[...new Set(catalog.sources.flatMap(s=>s.segments).filter(s=>s.coordinates).map(s=>'video-'+(s.placeId||s.id)))];
 const ctx=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 try {
 await p.goto(base+'/?view=food');await p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});
 const data=await p.evaluate(()=>window.foodCityMap.food.records.map(r=>({id:r.id,name:r.name,coords:r.coordinates,photo:r.photoURL,clip:r.localClip,author:r.clipAuthor,planning:r.planningLocation})));
 check('Supplied video places are unique and contain no old samples',data.length===mapIds.length&&data.every(r=>mapIds.includes(r.id)&&r.planning?.accuracy==='approximate'));
 check('Every map place has its matching cover, clip and creator',data.every(r=>r.photo?.includes(r.id.slice(6))&&r.clip?.includes(r.id.slice(6))&&r.author));
 check('One marker exists per distinct located place',await p.locator('.food-card').count()===mapIds.length);
 await p.screenshot({path:'../output/playwright/video-food-map-overview.png'});
 const first=data.find(r=>r.id==='video-nangua-sanyangzi');await p.evaluate(id=>window.foodCityMap.food.focusStops(id),first.id);await p.waitForTimeout(400);
 await p.locator('[data-food-id="video-nangua-sanyangzi"] .food-open').click({timeout:7000});
 check('Card opens inline popup, not modal',await p.locator('.food-inline-popover').isVisible()&&!await p.locator('#food-dialog').evaluate(e=>e.open));
 check('Creator and approximate position disclosed',(await p.locator('.food-inline-popover').innerText()).includes('南瓜小丸子')&&(await p.locator('.food-inline-popover').innerText()).includes('位置大致'));
 await p.locator('.food-popover-play').click({timeout:7000});await p.waitForFunction(()=>document.querySelector('.food-popover-media video')?.currentTime>.1,undefined,{timeout:12000});
 check('Correct original clip plays in popup',await p.locator('.food-popover-media video').evaluate(v=>v.currentSrc.includes('nangua-sanyangzi')&&v.videoWidth>0));
 await p.evaluate(()=>window.__oldClip=document.querySelector('.food-popover-media video'));
 await p.evaluate(()=>window.foodCityMap.food.focusStops('video-nangua-rongchang'));await p.waitForTimeout(300);
 await p.locator('[data-food-id="video-nangua-rongchang"] .food-open').click({timeout:7000});
 check('Selecting a second stop stops previous video',await p.evaluate(()=>window.__oldClip.paused&&!window.__oldClip.getAttribute('src')));
 check('Two places connect with approximate straight line',await p.locator('.food-distance-badge').count()===1&&(await p.locator('.food-distance-badge').innerText()).includes('直线'));
 for(const route of ['/places.html','/videos.html','/places/video-nangua-sanyangzi.html']){const res=await p.request.get(base+route),body=await res.text();check(route+' has the supplied video content',res.ok()&&!body.includes('超级李板凳面')&&!body.includes('赵二火锅')&&!body.includes('杉田千紘'));}
 check('Obsolete sample pages removed',(await p.request.get(base+'/places/osm-node-13649952401.html')).status()===404&&(await p.request.get(base+'/places/osm-node-4460519589.html')).status()===404);
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>window.foodCityMap.food.focusStops('video-nangua-sanyangzi'));await p.waitForTimeout(300);await p.locator('[data-food-id="video-nangua-sanyangzi"] .food-open').click({timeout:7000});
 const box=await p.locator('.food-inline-popover').boundingBox(),media=await p.locator('.food-popover-media').boundingBox();check('Mobile popup fits and video dominates',box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844&&media.height/box.height>=2/3,{box,media});
 await p.screenshot({path:'../output/playwright/video-food-map-mobile.png'});
 }catch(e){check('Browser flow completes',false,e.message)}finally{await ctx.close()}
 check('No runtime errors',errors.length===0,errors);return {checks,passed:checks.every(c=>c.passed)};
}
