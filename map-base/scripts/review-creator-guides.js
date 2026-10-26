async page=>{
  const base='http://127.0.0.1:8791',artifact='D:/codex/美食网站/output/playwright/',browser=page.context().browser();
  const li='osm-node-13649952401',zhao='osm-node-4460519589',wantsKey='foodcity:wants:chongqing:v1',draftKey='foodcity:content-review:chongqing:v1';
  const wants=JSON.stringify([zhao]),oldVersion='182c8dec629440ea2b19c3c1e8b696e38f55191558c8d76582a44209877e1e9f';
  const report={date:'2026-10-25',scope:'Independent Chromium contexts for the public creator library, actual local navigation, newest Li video links, embedded standalone and current/legacy workbench drafts. External navigation is fulfilled by a local synthetic response; no original-platform playback, live business, entrance or route validation is claimed. No real user browser storage is accessed.',checks:[],issues:[],pageErrors:[],externalPrefetch:[],interceptedExternalClicks:[],viewports:[]};
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),check=(name,passed,details)=>{report.checks.push({name,passed:!!passed,details});if(!passed)report.issues.push(name);};
  const ready=p=>p.waitForFunction(()=>window.foodCityMap?.ready,undefined,{timeout:30000});
  const foodReady=p=>p.waitForFunction(()=>window.foodCityMap?.food?.active,undefined,{timeout:30000});
  const settle=p=>p.waitForFunction(()=>window.foodCityMap?.map&&!window.foodCityMap.map.isMoving(),undefined,{timeout:25000});
  const safe=links=>links.filter(l=>!l.href.startsWith(base+'/')&&!l.href.startsWith('#')).every(l=>{try{const u=new URL(l.href);return u.protocol==='https:'&&!u.username&&!u.password&&l.target==='_blank'&&l.rel.split(/\s+/).includes('noopener')&&l.rel.split(/\s+/).includes('noreferrer');}catch{return false;}});
  const links=locator=>locator.evaluateAll(elements=>elements.map(e=>({text:e.textContent.trim(),href:e.href,target:e.target,rel:e.rel})));
  let expectedExternal=null;
  async function run(name,body,options={}){
    const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce',...options});
    context.on('page',p=>p.on('pageerror',error=>report.pageErrors.push(name+': '+error.message)));
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:8791\/)/,async route=>{
      const url=route.request().url();
      if(expectedExternal===url)report.interceptedExternalClicks.push(url);else report.externalPrefetch.push(url);
      await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="zh-CN"><title>Isolated QA external navigation</title><body>合成QA页面，只核对原页链接目标；未访问原平台，未测试播放。</body></html>'});
    });
    const p=await context.newPage();
    try{await body(p,context);}catch(error){check(name+' completes',false,{executionError:error.message});try{await p.screenshot({path:artifact+'creator-guides-failure.png'});}catch{}}
    finally{expectedExternal=null;await context.close();}
  }
  async function clickExternal(p,context,locator,url){expectedExternal=url;const opened=context.waitForEvent('page');await locator.click();const popup=await opened;await popup.waitForLoadState('domcontentloaded');const result={url:popup.url(),title:await popup.title()};await popup.close();expectedExternal=null;return result;}
  const guideData=await(await page.request.get(base+'/data/creator-guides.json')).json(),guide=guideData.guides[0];
  const expectedNames=['超级李板凳面','老甘家小龙虾江湖菜','林中乐辣子鸡','抄姐老火锅','轻松空间･虾蟹馆专注十年','牛莫王串串王'];
  await run('Static creator library',async(p,context)=>{
    const response=await p.goto(base+'/videos.html');
    const content=await p.evaluate(()=>({title:document.title,lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,main:!!document.querySelector('main'),articles:document.querySelectorAll('article.creator-guide').length,text:document.body.innerText,scripts:document.scripts.length,frames:document.querySelectorAll('iframe,video,audio').length,links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.href,target:e.target,rel:e.rel})),times:[...document.querySelectorAll('time')].map(e=>({text:e.textContent,date:e.dateTime})),rowData:[...document.querySelectorAll('.restaurant-row')].map(e=>({id:e.id,name:e.querySelector('.restaurant-name h3').textContent,category:e.querySelector('.category').textContent,address:e.querySelector('.restaurant-address p').textContent,chapter:e.querySelector('.chapter').textContent.replace('章节','').trim(),anchors:[...e.querySelectorAll('a')].map(a=>a.href),pending:!!e.querySelector('.pending-location')}))}));
    report.library={...content,text:undefined};
    check('Library is a readable Chinese semantic page with JavaScript disabled',response.status()===200&&content.lang==='zh-CN'&&content.h1===1&&content.main&&content.title==='重庆探店视频 · 食途'&&content.text.length>500,{status:response.status(),title:content.title,lang:content.lang});
    check('Library presents one author guide and exactly six source restaurant rows',guideData.guides.length===1&&content.articles===1&&content.rowData.length===6,{articles:content.articles,rows:content.rowData.length});
    check('All source names are preserved exactly including 抄姐, 轻松空间 and 牛莫王',eq(content.rowData.map(r=>r.name),expectedNames)&&eq(guide.restaurants.map(r=>r.name),expectedNames),content.rowData.map(r=>r.name));
    check('Every row retains the exact source category, address and chapter',content.rowData.every((r,i)=>r.id===guide.restaurants[i].id&&r.category===guide.restaurants[i].category&&r.address===guide.restaurants[i].addressText&&r.chapter===guide.restaurants[i].chapterText),content.rowData);
    check('Published, observed and prepared dates remain distinguishable',content.text.includes('发布')&&content.text.includes('原页文字读取')&&content.text.includes('页面整理于')&&content.text.includes('不代表近期到店')&&eq(content.times.map(t=>t.date),['2026-06-06','2026-10-25','2026-10-25'])&&content.times.every(t=>t.text===t.date),content.times);
    check('Exactly one related map candidate is linked and five unknown locations remain unlinked',content.rowData[0].anchors.length===1&&new URL(content.rowData[0].anchors[0]).searchParams.get('place')===li&&content.rowData.slice(1).every(r=>r.pending&&r.anchors.length===0)&&content.text.includes('分店对应仍待核'),content.rowData.map(r=>({name:r.name,anchors:r.anchors,pending:r.pending})));
    const invented=guide.restaurants.flatMap(r=>Object.keys(r).filter(k=>/coordinates|longitude|latitude|routeEligible|verified/i.test(k)).map(k=>r.id+'.'+k));
    check('Library source data contains no invented coordinates, pins or route authority',invented.length===0&&guide.restaurants.filter(r=>r.relatedCandidateId).length===1,{invented,relations:guide.restaurants.map(r=>r.relatedCandidateId)});
    check('External source anchors use safe HTTPS new windows',safe(content.links)&&content.links.filter(l=>l.href===guide.url).length===2,content.links.filter(l=>!l.href.startsWith(base+'/')));
    check('Chapter labels never fabricate timestamp deep links or playback promises',content.rowData.every(r=>!r.anchors.some(h=>new URL(h).searchParams.has('t')))&&content.links.filter(l=>l.href.includes('bilibili')).every(l=>l.href===guide.url)&&content.text.includes('尚未验证播放或站内嵌入')&&content.text.includes('章节是作者简介中的时间标注'),{original:guide.url,chapterNote:await p.locator('.chapter-note').textContent()});
    check('Static library has no scripts, embedded players, external preloads or speculative prefetch',content.scripts===0&&content.frames===0&&await p.locator('link[rel=prefetch],link[rel=preload],link[rel=preconnect],link[rel=dns-prefetch]').count()===0,{scripts:content.scripts,embeddedMedia:content.frames});
    const internal=[...new Set(content.links.filter(l=>l.href.startsWith(base+'/')).map(l=>l.href.split('#')[0]))],statuses=[];
    for(const url of internal){const r=await p.request.get(url);statuses.push({url,status:r.status()});}
    check('Every generated internal library link resolves over local HTTP',statuses.length>0&&statuses.every(r=>r.status===200),statuses);
    const image=await p.locator('.hero-image').evaluate(async e=>{const value=getComputedStyle(e).backgroundImage,url=value.match(/url\(["']?([^"')]+)["']?\)/)?.[1];const im=new Image();im.src=url;await im.decode();return {url,width:im.naturalWidth,height:im.naturalHeight,label:e.getAttribute('aria-label')};});
    check('Local hero illustration decodes and preserves its AI/non-photo label',image.url.startsWith(base+'/')&&image.width>0&&image.height>0&&image.label.includes('AI生成')&&image.label.includes('非视频门店'),image);
    for(const [width,height]of [[1440,960],[390,844],[320,680],[736,414]]){
      await p.setViewportSize({width,height});await p.evaluate(()=>scrollTo(0,0));
      const geometry=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,outside:[...document.querySelectorAll('main,article,header,footer,.restaurant-row')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,class:e.className,left:r.left,right:r.right};}).filter(r=>r.left<-.6||r.right>innerWidth+.6)}));
      let reachable=true;const actionRects=[];
      for(const selector of ['.video-cta','.candidate-link','.reading-note .quiet-link','.footer-top>a:last-child']){const locator=p.locator(selector);await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();actionRects.push({selector,...r});reachable&&=r&&r.x>=-.5&&r.y>=-.5&&r.x+r.width<=width+.5&&r.y+r.height<=height+.5;}
      check('Readable rows and source/map/footer actions fit and remain reachable at '+width+'×'+height,geometry.scrollWidth===width&&geometry.outside.length===0&&reachable,{...geometry,actionRects});report.viewports.push({width,height,...geometry});
      if(width===1440||width===390){await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:artifact+'creator-guides-'+width+'.png',fullPage:false});}
      if(width===390){await p.locator('.guide-source').scrollIntoViewIfNeeded();await p.screenshot({path:artifact+'creator-guides-source-390.png'});await p.locator('#chaojie').scrollIntoViewIfNeeded();await p.screenshot({path:artifact+'creator-guides-rows-390.png'});}
    }
    const outcome=await clickExternal(p,context,p.locator('.video-cta'),guide.url);
    check('Actual library original-video action reaches the exact author URL through local interception',outcome.url===guide.url&&outcome.title==='Isolated QA external navigation',outcome);
  },{javaScriptEnabled:false});
  await run('Ordinary map stays lazy',async p=>{
    const requests=[];p.on('request',r=>requests.push(r.url()));await p.goto(base+'/');await ready(p);await settle(p);
    const state=await p.evaluate(()=>({phase:window.foodCityMap.food.phase,open:document.querySelector('#food-dialog').open}));
    check('Ordinary map does not fetch creator library or optional candidate data',state.phase==='unloaded'&&!state.open&&!requests.some(u=>/creator-guides\.json|food-records\.json|videos\.html/.test(u)),{state,optionalRequests:requests.filter(u=>/creator-guides|food-records|videos\.html/.test(u))});
  });
  await run('Library to Li map and newest original link',async(p,context)=>{
    await p.addInitScript(({wantsKey,wants})=>localStorage.setItem(wantsKey,wants),{wantsKey,wants});await p.goto(base+'/videos.html');await p.locator('.candidate-link').click();await foodReady(p);await p.waitForFunction(()=>document.querySelector('#food-dialog').open);await settle(p);
    const state=await p.evaluate(wantsKey=>({selected:window.foodCityMap.food.selected.id,title:document.querySelector('#food-title').textContent,records:window.foodCityMap.food.records.map(r=>({id:r.id,eligible:r.routeEligible,status:r.verificationStatus})),stored:localStorage.getItem(wantsKey)}),wantsKey);
    check('Actual library map action opens Li detail while preserving two source candidates and saved wants',state.selected===li&&state.title===expectedNames[0]&&state.records.length===2&&state.records.every(r=>r.eligible===false&&r.status==='source-record')&&state.stored===wants,state);
    const videos=await links(p.locator('#food-videos a')),text=await p.locator('#food-video-section').textContent();
    check('Li detail lists newest 2026 video before the retained 2020 original with dates and chapter',videos.length===2&&videos[0].href===guide.url&&videos[1].href==='https://www.bilibili.com/video/BV1wC4y1x7Wc/'&&safe(videos)&&text.includes('2026-06-06')&&text.includes('2020-04-20')&&text.includes('作者标注 0:40')&&text.includes('分店待核'),{videos,text});
    await p.screenshot({path:artifact+'creator-guides-li-detail-1440.png'});await p.locator('#food-close').click();
    const quick=p.locator('.food-card[data-food-id='+JSON.stringify(li)+'] .food-original-video'),quickState=await quick.evaluate(e=>({href:e.href,title:e.title,label:e.getAttribute('aria-label'),target:e.target,rel:e.rel}));
    const quickClick=await clickExternal(p,context,quick,guide.url);
    check('Actual Li quick-original action selects the newest safe URL and preserves chapter context',quickState.href===guide.url&&quickState.label.includes('2026-06-06')&&quickState.label.includes('0:40')&&safe([quickState])&&quickClick.url===guide.url,{quickState,quickClick});
    const mobilePicker=[];
    for(const [width,height]of [[390,844],[320,680],[736,414]]){
      await p.setViewportSize({width,height});await p.locator('#food-pick-open').click();
      const geometry=await p.locator('#food-pick-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};});
      const actions=[];
      for(const selector of ['#food-pick-guides','#food-pick-close','#food-pick-map','#food-pick-add']){const action=p.locator(selector);await action.scrollIntoViewIfNeeded();actions.push({selector,...await action.boundingBox()});}
      mobilePicker.push({width,height,geometry,actions,fits:geometry.left>=-.5&&geometry.right<=width+.5&&geometry.top>=-.5&&geometry.bottom<=height+.5&&geometry.scrollWidth<=geometry.clientWidth+1&&actions.every(r=>r.x>=-.5&&r.y>=-.5&&r.x+r.width<=width+.5&&r.y+r.height<=height+.5)});
      if(width===390||width===320){await p.locator('#food-pick-guides').scrollIntoViewIfNeeded();await p.screenshot({path:artifact+'creator-guides-picker-'+width+'.png'});}await p.locator('#food-pick-close').click();
    }
    check('New picker-library action and existing category actions remain reachable in mobile/short landscape dialogs',mobilePicker.every(v=>v.fits),mobilePicker);
    await p.setViewportSize({width:1440,height:960});await p.locator('#food-pick-open').click();const pickerLink=p.locator('#food-pick-guides');const pickerPromise=context.waitForEvent('page');await pickerLink.click();const library=await pickerPromise;await library.waitForLoadState('domcontentloaded');
    check('Actual food-picker entry opens the public video library',new URL(library.url()).pathname==='/videos.html'&&await library.locator('.restaurant-row').count()===6,{url:library.url()});await library.close();await p.locator('#food-pick-close').click();
    await p.locator('#about-map').click();const sourcePromise=context.waitForEvent('page');await p.locator('#creator-guides-link').click();const sourceLibrary=await sourcePromise;await sourceLibrary.waitForLoadState('domcontentloaded');
    check('Actual map-source dialog entry opens the same public library',new URL(sourceLibrary.url()).pathname==='/videos.html'&&await sourceLibrary.locator('.restaurant-row').count()===6,{url:sourceLibrary.url()});await sourceLibrary.close();
  });
  await run('Static place footer library entries',async(p,context)=>{
    const results=[];
    for(const file of ['places.html','places/'+li+'.html','places/'+zhao+'.html']){
      await p.goto(base+'/'+file);const footer=p.locator('footer a[href$="videos.html"]');
      if(await footer.count()){await footer.click();results.push({file,url:p.url(),rows:await p.locator('.restaurant-row').count()});}else results.push({file,missing:true});
    }
    check('Actual directory and both place-footer entries reach all six library rows',results.length===3&&results.every(r=>!r.missing&&new URL(r.url).pathname==='/videos.html'&&r.rows===6),results);
    await p.goto(base+'/places/'+li+'.html');const vids=await links(p.locator('.video-list a')),sourceText=await p.locator('.source-aside').textContent();
    check('Li static page retains both videos, chapter and independent 25/22 source-reading dates',vids.length===2&&vids[0].href===guide.url&&vids[1].href.includes('BV1wC4y1x7Wc')&&safe(vids)&&(await p.locator('.video-list').textContent()).includes('0:40')&&sourceText.includes('原页文字读取 2026-10-25')&&sourceText.includes('原页文字读取 2026-10-22'),{videos:vids,sourceText});
  },{javaScriptEnabled:false});
  await run('Embedded standalone',async(p,context)=>{
    const url=base+'/preview.html?view=food&place='+li,requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await p.goto(url);await foodReady(p);await p.waitForFunction(()=>document.querySelector('#food-dialog').open);await settle(p);
    const vids=await links(p.locator('#food-videos a'));
    check('Exact standalone has newest and historical video links with zero subsidiary HTTP requests',requests.length===1&&requests[0]===url&&vids.length===2&&vids[0].href===guide.url&&vids[1].href.includes('BV1wC4y1x7Wc')&&(await p.locator('#food-video-section').textContent()).includes('0:40'),{requests,videos:vids});
    await p.locator('#food-close').click();await p.locator('#about-map').click();const promise=context.waitForEvent('page');await p.locator('#creator-guides-link').click();const library=await promise;await library.waitForLoadState('domcontentloaded');
    check('Standalone source entry resolves to the local readable library',new URL(library.url()).pathname==='/videos.html'&&await library.locator('.restaurant-row').count()===6,{url:library.url()});await library.close();
  });
  await run('Current workbench materials',async p=>{
    await p.goto(base+'/content-review.html');await p.waitForFunction(()=>!document.querySelector('#workbench').hidden);await p.locator('#tab-evidence').click();
    const catalog=await(await p.request.get(base+'/data/content-review-catalog.json')).json(),seed=catalog.candidates.find(c=>c.id===li).seed,evidence=seed.evidence;
    report.workbench={baseVersion:catalog.baseVersion,evidence};
    check('Current workbench loads five separate Li materials and both existing candidates',evidence.length===5&&await p.locator('#evidence-list .evidence-card').count()===5&&await p.locator('#candidate-list button').count()===2&&await p.evaluate(draftKey=>localStorage.getItem(draftKey)===null,draftKey),{count:evidence.length,candidates:await p.locator('#candidate-list button').count(),baseVersion:catalog.baseVersion});
    const newVideo=evidence.find(e=>e.id==='video-0'),oldVideo=evidence.find(e=>e.id==='video-1');
    check('Workbench distinguishes new 25 October video/address reads from retained 22 October historical video read',newVideo.url===guide.url&&newVideo.observedOn==='2026-10-25'&&newVideo.publishedOn==='2026-06-06'&&newVideo.note.includes('0:40')&&evidence.find(e=>e.id==='address-0').observedOn==='2026-10-25'&&oldVideo.observedOn==='2026-10-22'&&oldVideo.publishedOn==='2020-04-20'&&(await p.locator('#evidence-list').textContent()).includes('读取 2026-10-22'),{newVideo,oldVideo});
    check('Current source seed remains incomplete with entrance/branch/connection unchecked and public status unchanged',await p.locator('#record-state').getAttribute('data-status')==='incomplete'&&['branch','entrance','connection'].every(k=>seed.checks[k].conclusion==='needs-evidence')&&catalog.candidates.every(c=>c.publicStatus.routeEligible===false&&c.publicStatus.verificationStatus==='source-record'),{state:await p.locator('#record-state').textContent(),checks:seed.checks});
    const legacy={schemaVersion:1,kind:'local-review-draft',city:'chongqing',baseVersion:oldVersion,updatedAt:'2026-10-24T08:00:00.000Z',records:catalog.candidates.map(c=>JSON.parse(JSON.stringify(c.seed)))};
    const legacyLi=legacy.records.find(r=>r.candidateId===li);legacyLi.evidence=legacyLi.evidence.filter(e=>e.id!=='video-0');legacyLi.evidence.find(e=>e.id==='video-1').id='video-0';
    for(const r of legacy.records)for(const c of Object.values(r.checks))c.evidenceIds=c.evidenceIds.filter(id=>r.evidence.some(e=>e.id===id));
    legacyLi.notes='合成QA旧草稿，保留原证据，不代表事实核实。';const raw=JSON.stringify(legacy);
    await p.evaluate(({draftKey,raw,wantsKey,wants})=>{localStorage.setItem(draftKey,raw);localStorage.setItem(wantsKey,wants);localStorage.setItem('creator-guides-qa-unrelated','isolated-preserve');},{draftKey,raw,wantsKey,wants});await p.reload();await p.waitForFunction(()=>!document.querySelector('#workbench').hidden);await p.locator('#tab-evidence').click();
    const after=await p.evaluate(({draftKey,wantsKey})=>({raw:localStorage.getItem(draftKey),wants:localStorage.getItem(wantsKey),unrelated:localStorage.getItem('creator-guides-qa-unrelated')}),{draftKey,wantsKey});
    check('Legacy base draft remains stale/incomplete without auto-inserting or replacing its retained materials',await p.locator('#record-state').getAttribute('data-status')==='incomplete'&&(await p.locator('#base-version').textContent()).includes('旧版草稿')&&(await p.locator('#missing-list').textContent()).includes('旧版基础资料')&&after.raw===raw&&await p.locator('#evidence-list .evidence-card').count()===4,{baseVersion:oldVersion,state:await p.locator('#record-state').textContent(),materialTitles:await p.locator('#evidence-list h3').allTextContents(),unchanged:after.raw===raw});
    check('Legacy draft review preserves saved wants and unrelated local state',after.wants===wants&&after.unrelated==='isolated-preserve',{wants:after.wants,unrelated:after.unrelated});
  });
  check('All library, map, standalone and workbench scenarios have no page errors',report.pageErrors.length===0,report.pageErrors);
  check('Pages make no external prefetch or automatic media requests',report.externalPrefetch.length===0&&report.interceptedExternalClicks.length===2,{externalPrefetch:report.externalPrefetch,interceptedExternalClicks:report.interceptedExternalClicks});
  report.passed=report.issues.length===0;return report;
}
