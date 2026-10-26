async page=>{
  const base='http://127.0.0.1:8791',key='foodcity:wants:chongqing:v1',ids=['osm-node-13649952401','osm-node-4460519589'];
  const names=['超级李板凳面','赵二火锅'],seed=JSON.stringify([ids[1]]),browser=page.context().browser();
  const report={date:'2026-10-24',scope:'Independent browser contexts for static candidate information pages and one-time map deep links. No external sources opened, no real merchant/entrance/playback verification, and no user storage changed.',checks:[],issues:[],pageErrors:[],externalRequests:[],staticPages:[]};
  const check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready,undefined,{timeout:25000});
  const foodReady=p=>p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:25000});
  const settled=p=>p.waitForFunction(()=>window.foodCityMap?.map&&!window.foodCityMap.map.isMoving(),undefined,{timeout:20000});
  const modal=p=>p.locator('#food-dialog').evaluate(e=>e.open);
  async function run(name,body,options={}){
    const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce',...options}),p=await context.newPage();
    context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))report.externalRequests.push(r.url());});
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,route=>route.abort());
    p.on('pageerror',e=>report.pageErrors.push(name+': '+e.message));
    try{await body(p,context);}catch(e){check(name,false,{executionError:e.message});try{await p.screenshot({path:'D:/codex/美食网站/output/playwright/place-pages-failure.png'});}catch{}}
    finally{await context.close();}
  }
  function assessExternal(links){return links.filter(l=>l.href.startsWith('https://')).every(l=>{const u=new URL(l.href),rel=l.rel.split(/\s+/);return !u.username&&!u.password&&l.target==='_blank'&&rel.includes('noopener')&&rel.includes('noreferrer');});}
  for(const file of ['places.html',...ids.map(id=>'places/'+id+'.html')])await run('Static page '+file,async p=>{
    const response=await p.goto(base+'/'+file);const content=await p.evaluate(()=>({title:document.title,lang:document.documentElement.lang,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),description:document.querySelector('meta[name="description"]')?.content,main:!!document.querySelector('main'),article:!!document.querySelector('article'),text:document.body.innerText,scripts:document.scripts.length,iframes:document.querySelectorAll('iframe').length,localBusiness:/LocalBusiness/.test(document.documentElement.innerHTML),canonical:document.querySelector('link[rel="canonical"]')?.href||'',links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.href,target:e.target,rel:e.rel})),schema:document.querySelectorAll('script[type="application/ld+json"]').length}));
    report.staticPages.push({file,...content});
    check(file+' has readable semantic content with JavaScript disabled',response.status()===200&&content.lang==='zh-CN'&&content.h1.length===1&&content.main&&content.description&&content.title.includes('食途')&&content.text.length>180,content);
    check(file+' preserves candidate and illustration/date distinctions',/待核|待确认|尚未确认/.test(content.text)&&/AI|生成/.test(content.text)&&/示意/.test(content.text)&&content.text.includes('2026-10-24')&&(file==='places.html'||content.text.includes('2026-10-19')),{text:content.text});
    check(file+' has no runtime scripts, embedded players, fake business schema or localhost canonical',content.scripts===0&&content.iframes===0&&!content.localBusiness&&!content.canonical.includes('127.0.0.1')&&!/人均\s*[:：]?\s*[¥￥]\s*\d|营业时间\s*[:：]\s*\d|评分\s*[:：]\s*\d/.test(content.text),{scripts:content.scripts,iframes:content.iframes,canonical:content.canonical});
    check(file+' external source anchors are safe HTTPS new tabs',assessExternal(content.links)&&!content.links.some(l=>/^(javascript|data|file):/.test(l.href)),content.links);
    const local=[...new Set(content.links.filter(l=>l.href.startsWith(base+'/')).map(l=>l.href.split('#')[0]))];const statuses=[];
    for(const url of local){const r=await p.request.get(url);statuses.push({url,status:r.status()});}
    check(file+' all generated internal anchors resolve',statuses.length>0&&statuses.every(r=>r.status===200),statuses);
    const imageResult=await p.evaluate(async()=>{
      const all=[...document.querySelectorAll('*')],backgrounds=all.map(e=>getComputedStyle(e).backgroundImage).filter(v=>v&&v!=='none'),urls=[...new Set(backgrounds.flatMap(v=>[...v.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1])))];
      const images=[];for(const url of urls){const im=new Image();im.src=url;try{await im.decode();images.push({url,width:im.naturalWidth,height:im.naturalHeight});}catch{images.push({url,width:0,height:0});}}
      for(const im of document.images)images.push({url:im.src,width:im.naturalWidth,height:im.naturalHeight});return images;
    });
    check(file+' local food illustrations decode',imageResult.length>0&&imageResult.every(im=>im.url.startsWith(base+'/')&&im.width>0&&im.height>0),imageResult);
    for(const [width,height]of [[1440,960],[390,844],[320,680]]){
      await p.setViewportSize({width,height});const geometry=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,overflow:[...document.querySelectorAll('main,article,header,figure,section')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,class:e.className,left:r.left,right:r.right};}).filter(r=>r.left<-.6||r.right>innerWidth+.6)}));
      check(file+' remains within '+width+' viewport',geometry.scrollWidth<=width&&geometry.overflow.length===0,geometry);
      if(file==='places/'+ids[0]+'.html'&&(width===1440||width===390))await p.screenshot({path:'D:/codex/美食网站/output/playwright/place-page-'+width+'.png'});
    }
    if(file==='places.html')check('Directory links to both exact candidate pages',ids.every(id=>content.links.some(l=>new URL(l.href).pathname==='/places/'+id+'.html')),content.links);
    else{const index=ids.findIndex(id=>file.includes(id)),mapLink=content.links.find(l=>{try{const u=new URL(l.href);return u.origin===base&&u.searchParams.get('place')===ids[index]&&u.searchParams.get('view')==='food';}catch{return false;}});check(names[index]+' static page links to its exact map candidate',!!mapLink&&content.h1[0].includes(names[index])&&content.article,{mapLink,h1:content.h1});}
  },{javaScriptEnabled:false});
  await run('Default map remains lazy',async p=>{
    const requests=[];p.on('request',r=>requests.push(r.url()));await p.goto(base+'/');await ready(p);await settled(p);
    const state=await p.evaluate(()=>({phase:window.foodCityMap.food.phase,modal:document.querySelector('#food-dialog').open}));
    check('Default map still does not fetch food or open a candidate',state.phase==='unloaded'&&!state.modal&&!requests.some(u=>u.includes('/data/food-records.json')),state);
  });
  for(const [index,query]of [[0,'?view=food&place='+ids[0]],[1,'?view=food&place='+ids[1]],[0,'?place='+ids[0]]])await run('Map deep link '+query,async(p,context)=>{
    await p.addInitScript(({key,seed})=>localStorage.setItem(key,seed),{key,seed});await p.goto(base+'/'+query);await foodReady(p);await p.waitForFunction(()=>document.querySelector('#food-dialog').open);await settled(p);
    const state=await p.evaluate(key=>({title:document.querySelector('#food-title').textContent,id:window.foodCityMap.food.selected?.id,href:document.querySelector('#food-page-link').href,hidden:document.querySelector('#food-page-link').hidden,target:document.querySelector('#food-page-link').target,rel:document.querySelector('#food-page-link').rel,stored:localStorage.getItem(key),eligibility:window.foodCityMap.food.records.map(r=>r.routeEligible)}),key);
    check('Deep link '+query+' opens only the exact source candidate without changing saved wants',state.id===ids[index]&&state.title===names[index]&&state.stored===seed&&state.eligibility.every(v=>v===false),state);
    check('Deep link '+query+' exposes the matching independent page safely',!state.hidden&&new URL(state.href).pathname==='/places/'+ids[index]+'.html'&&state.target==='_blank'&&state.rel.includes('noopener')&&state.rel.includes('noreferrer'),state);
    if(index===0&&query.includes('view=')){
      const popupPromise=context.waitForEvent('page');await p.locator('#food-page-link').click();const info=await popupPromise;await info.waitForLoadState('domcontentloaded');
      check('Actual detail-page action opens the correct readable static page',new URL(info.url()).pathname==='/places/'+ids[0]+'.html'&&(await info.locator('h1').textContent()).includes(names[0]),{url:info.url()});
      const maps=await info.locator('a[href]').evaluateAll(elements=>elements.map(e=>({href:e.href,target:e.target})).filter(l=>new URL(l.href).searchParams.get('place')==='osm-node-13649952401'));
      const exact=info.locator('a[href*="place='+ids[0]+'"]').first();let roundtrip=info;
      if(await exact.getAttribute('target')==='_blank'){const next=context.waitForEvent('page');await exact.click();roundtrip=await next;}else await exact.click();
      await foodReady(roundtrip);await roundtrip.waitForFunction(()=>document.querySelector('#food-dialog').open);check('Actual static-page map link returns to the same candidate detail',(await roundtrip.locator('#food-title').textContent())===names[0],maps);if(roundtrip!==info)await roundtrip.close();await info.close();
    }
    await p.locator('#food-close').click();await p.locator('#food-entry').click();await p.locator('#food-entry').click();await foodReady(p);await settled(p);
    check('Deep link '+query+' is consumed once and does not reopen on later exploration',!await modal(p)&&await p.evaluate(()=>window.foodCityMap.food.initialPlaceId===null));
  });
  await run('Unknown place is safe',async p=>{
    await p.addInitScript(({key,seed})=>localStorage.setItem(key,seed),{key,seed});const bad='missing"><img src=x onerror=window.__placeInjected=1>';
    await p.goto(base+'/?view=food&place='+encodeURIComponent(bad));await foodReady(p);await settled(p);
    const state=await p.evaluate(key=>({count:window.foodCityMap.food.records.length,selected:window.foodCityMap.food.selected?.id||null,modal:document.querySelector('#food-dialog').open,injected:window.__placeInjected||null,hostileNodes:document.querySelectorAll('img[src="x"]').length,stored:localStorage.getItem(key),status:document.querySelector('#status').textContent}),key);
    check('Unknown/XSS-looking place ID never creates a shop, script or modal',state.count===2&&state.selected===null&&!state.modal&&!state.injected&&state.hostileNodes===0&&state.stored===seed,state);
  });
  for(const action of ['2D','reset','drag'])await run('Delayed place cancelled by '+action,async p=>{
    let release,received;const gate=new Promise(r=>release=r),request=new Promise(r=>received=r);const handler=async route=>{received();await gate;try{await route.continue();}catch{}};await p.route('**/data/food-records.json',handler);
    try{
      await p.goto(base+'/?view=food&place='+ids[0]);await ready(p);await request;
      if(action==='2D')await p.locator('#view-2d').click();else if(action==='reset')await p.locator('#reset-view').click();else{const r=await p.locator('.maplibregl-canvas').boundingBox(),x=r.x+r.width*.5,y=r.y+r.height*.5;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+65,y+40,{steps:6});await p.mouse.up();}
      await settled(p);const expected=await p.evaluate(()=>({center:window.foodCityMap.map.getCenter().toArray(),pitch:window.foodCityMap.map.getPitch(),zoom:window.foodCityMap.map.getZoom()}));release();await p.waitForFunction(()=>window.foodCityMap.food.phase==='loaded');await settled(p);
      const state=await p.evaluate(()=>({active:window.foodCityMap.food.active,modal:document.querySelector('#food-dialog').open,initial:window.foodCityMap.food.initialPlaceId,center:window.foodCityMap.map.getCenter().toArray(),pitch:window.foodCityMap.map.getPitch(),zoom:window.foodCityMap.map.getZoom()}));
      check(action+' during loading cancels the deep-link modal and preserves the new camera',!state.active&&!state.modal&&state.initial===null&&state.center.every((v,i)=>Math.abs(v-expected.center[i])<.000005)&&Math.abs(state.pitch-expected.pitch)<.01&&Math.abs(state.zoom-expected.zoom)<.005,{expected,state});
      await p.locator('#food-entry').click();await foodReady(p);await settled(p);check(action+' cancellation remains consumed when food exploration is reopened',!await modal(p));
    }finally{release();}
  });
  await run('Deep link retries after optional fetch failure',async p=>{
    const fail=route=>route.fulfill({status:503,body:'Synthetic optional-data failure'});await p.route('**/data/food-records.json',fail);await p.goto(base+'/?view=food&place='+ids[1]);await ready(p);await p.waitForFunction(()=>window.foodCityMap.food.phase==='error');
    check('Optional fetch error does not open a blank place dialog',!await modal(p)&&await p.evaluate(()=>window.foodCityMap.ready));await p.unroute('**/data/food-records.json',fail);await p.locator('#food-entry').click();await foodReady(p);await p.waitForFunction(()=>document.querySelector('#food-dialog').open);
    check('Explicit food retry opens the originally requested valid place',(await p.locator('#food-title').textContent())===names[1]);
  });
  await run('Explicit road mode wins over place parameter',async p=>{
    await p.goto(base+'/?view=walk&place='+ids[0]);await p.waitForFunction(()=>window.foodCityMap?.walk?.active,undefined,{timeout:25000});check('Road-trial deep link does not get replaced by a shop dialog',!await modal(p)&&await p.evaluate(()=>!window.foodCityMap.food.active));
  });
  await run('Source directory entry and standalone deep link',async(p,context)=>{
    const url=base+'/preview.html?view=food&place='+ids[0],requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await p.goto(url);await foodReady(p);await p.waitForFunction(()=>document.querySelector('#food-dialog').open);await settled(p);
    check('Exact standalone opens the same candidate without subsidiary HTTP',await p.locator('#food-title').textContent()===names[0]&&requests.length===1&&requests[0]===url,{requests});
    await p.locator('#food-close').click();await p.locator('#about-map').click();const link=p.locator('#place-directory-link');
    check('Map source dialog exposes the local information directory',await link.isVisible()&&new URL(await link.getAttribute('href'),p.url()).pathname==='/places.html');const pop=context.waitForEvent('page');await link.click();const directory=await pop;await directory.waitForLoadState('domcontentloaded');check('Actual directory action reaches the generated directory',new URL(directory.url()).pathname==='/places.html'&&await directory.locator('a[href*="osm-node-"]').count()>=2,{url:directory.url()});await directory.close();
  });
  check('All page and deep-link scenarios emit no page errors',report.pageErrors.length===0,report.pageErrors);check('Pages do not prefetch external sources or media',report.externalRequests.length===0,report.externalRequests);
  report.passed=report.issues.length===0;return report;
}
