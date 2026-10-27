async page=>{
 const base='http://127.0.0.1:8791',root='D:/codex/美食网站/',browser=page.context().browser(),report={date:'2026-10-27',scope:'Isolated local Chromium; primary address evidence shown in existing store-clip details. No shop coordinate, route or live operating status is asserted.',checks:[],errors:[],external:[]};
 const check=(name,passed,details)=>report.checks.push({name,passed:!!passed,details});
 const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async r=>{report.external.push(r.request().url());await r.abort();});const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 try{
  for(const [id,name,domain,phrase]of [['nangua-cailanzi','菜篮子','scjgj.cq.gov.cn','政府许可资料'],['nangua-nendouya','嫩豆芽老火锅','www.hjmthot.com','品牌官网']]){
   await p.goto(base+'/?view=food&videos=1&clip='+id);await p.waitForFunction(()=>window.foodCityMap?.food?.active&&document.querySelectorAll('.video-clip-card').length===11,undefined,{timeout:30000});
   check(name+' deep link opens the exact video',await p.locator('#video-library-player h3').textContent()===name);
   await p.waitForFunction(()=>document.querySelector('#video-library-player video')?.readyState>=2);check(name+' clip still decodes',await p.locator('#video-library-player video').evaluate(v=>v.videoWidth===576&&v.videoHeight===1024&&v.paused));
   check(name+' has a truthful address-only status',(await p.locator('.video-location-note').textContent()).includes(phrase)&&(await p.locator('.video-location-note').textContent()).includes('地图点位仍待补齐'));
   check(name+' does not borrow a nearby-reference action or create new map points',await p.locator('.video-nearby-button').count()===0&&await p.evaluate(()=>window.foodCityMap.getStats().foodCards===2));
   await p.locator('.video-address-review summary').click();
   const evidence=await p.locator('.video-address-review a').evaluateAll(es=>es.map(e=>({href:e.href,hostname:e.hostname,rel:e.rel,target:e.target,text:e.textContent})));
   check(name+' exposes the original source and the specific primary-page link',evidence.length===2&&evidence.some(e=>e.hostname===domain)&&evidence.some(e=>e.hostname==='www.douyin.com')&&evidence.every(e=>e.href.startsWith('https:')&&e.target==='_blank'&&e.rel.includes('noopener')&&e.rel.includes('noreferrer')),evidence);
   for(const [width,height]of [[1440,960],[390,844],[320,680]]){
    await p.setViewportSize({width,height});const primary=p.locator('.video-address-review a').last();await primary.scrollIntoViewIfNeeded();
    const r=await primary.boundingBox(),layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    check(name+' primary address link remains reachable at '+width,r&&r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height&&layout.width===layout.scroll,{rect:r,...layout});
    if(id==='nangua-cailanzi'&&(width===1440||width===390))await p.screenshot({path:root+'output/playwright/video-address-cailanzi-'+width+'.png'});
   }
   await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('video-library-dialog').open);check(name+' closes without leaving media active',await p.locator('#video-library-player video').evaluate(v=>v.paused&&!v.getAttribute('src')));
   await p.setViewportSize({width:1440,height:960});
  }
  await p.goto(base+'/?view=food&videos=1&clip=nangua-sanyangzi');await p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});check('Existing Luohan reference action remains limited to its own reviewed clip',await p.locator('#video-library-player h3').textContent()==='三样子'&&await p.locator('.video-nearby-button').textContent()==='看看罗汉寺附近 ↗');
 }catch(error){check('Address review UI completes',false,error.message);await p.screenshot({path:root+'output/playwright/video-address-failure.png'}).catch(()=>{});}finally{await context.close();}
 check('No uncaught page errors',report.errors.length===0,report.errors);check('Primary pages and brand photo are not automatically requested',report.external.length===0,report.external);report.passed=report.checks.every(c=>c.passed);return report;
}
