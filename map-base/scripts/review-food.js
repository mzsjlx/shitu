async page=>{
  const report={date:'2026-10-22',scope:'Local food candidate experience, browser simulation; no publication, no verified-shop or route claim.',checks:[],issues:[],pageErrors:[],consoleErrors:[]};
  const requests=[],responses=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('response',r=>responses.push({url:r.url(),status:r.status()}));
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const settle=async()=>{
    await page.waitForFunction(()=>window.foodCityMap?.ready&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded(),undefined,{timeout:25000});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  };
  const boxes=()=>page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],header:box(document.querySelector('.topbar')),controls:[...document.querySelectorAll('.topbar button,.brand,.city-chip')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')||e.textContent,box:box(e)})),cards:[...document.querySelectorAll('.food-card')].map(e=>({id:e.dataset.foodId,collapsed:e.classList.contains('is-collapsed'),box:box(e)})),dialogs:[...document.querySelectorAll('dialog[open]')].map(box)};
  });
  const anchors=()=>page.evaluate(()=>{
    const api=window.foodCityMap,container=api.map.getContainer().getBoundingClientRect();
    return api.food.records.map(item=>{
      const r=document.querySelector('[data-food-id="'+item.id+'"] .food-pin').getBoundingClientRect(),p=api.map.project(item.coordinates);
      const actual=[r.left+r.width/2-container.left,r.top+r.height/2-container.top];
      return {id:item.id,projected:[p.x,p.y],actual,error:Math.hypot(actual[0]-p.x,actual[1]-p.y)};
    });
  });
  try{
    await page.setViewportSize({width:1440,height:960});
    await page.goto('http://127.0.0.1:8791/');await settle();
    await page.evaluate(()=>{localStorage.removeItem('foodcity:wants:chongqing:v1');});
    await page.reload();await settle();
    check('Default map does not request food records or show cards',await page.evaluate(()=>window.foodCityMap.food.phase==='unloaded'&&window.foodCityMap.getStats().foodCards===0)&&!requests.some(u=>u.includes('food-records.json')));
    await page.locator('#food-entry').click();
    await page.waitForFunction(()=>window.foodCityMap.food.active);await settle();
    const food=await page.evaluate(()=>({base:window.foodCityMap.getStats(),food:window.foodCityMap.food.getStats(),records:window.foodCityMap.food.records.map(r=>({id:r.id,status:r.verificationStatus,entrance:r.entranceStatus,coords:r.coordinates,system:r.coordinateSystem,osm:r.coordinateEvidence.id})),labels:[...document.querySelectorAll('.food-record-state')].map(e=>e.textContent)}));
    check('Two WGS84 source records are visibly marked as unverified candidates',food.base.foodCards===2&&food.records.every(r=>r.status==='source-record'&&r.entrance==='unverified'&&r.system==='WGS84')&&food.labels.length===2&&food.labels.every(s=>s==='店址待核实'),food);
    const initialBoxes=await boxes();
    check('Both independent desktop cards fit the map',initialBoxes.cards.every(c=>!c.collapsed&&c.box.left>=0&&c.box.right<=1440&&c.box.top>=76&&c.box.bottom<=855),initialBoxes);
    const image=await page.evaluate(async()=>{
      const src=window.foodCityMap.food.records[0].spriteURL,img=new Image();img.src=src;await img.decode();
      return {width:img.naturalWidth,height:img.naturalHeight,disclosures:[...document.querySelectorAll('.food-card .photo-note')].map(e=>e.textContent)};
    });
    check('Local concept image decodes and both cards disclose illustration',image.width===2172&&image.height===724&&image.disclosures.length===2&&image.disclosures.every(t=>t==='菜品示意'),image);
    const before=await anchors();
    await page.evaluate(()=>{const m=window.foodCityMap.map;m.jumpTo({center:[106.5801,29.5629],bearing:-10,zoom:m.getZoom()+.1});});await settle();
    const after=await anchors();
    check('Both geographic dots retain anchors after pan, rotation and zoom',before.every(a=>a.error<1.5)&&after.every(a=>a.error<1.5),{before,after});
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-desktop.png'});
    await page.evaluate(()=>{window.__foodMapClicks=0;window.foodCityMap.map.on('click',()=>window.__foodMapClicks++);});
    await page.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();
    const detail=await page.locator('#food-dialog').evaluate(e=>({open:e.open,text:e.textContent,videos:[...e.querySelectorAll('.video-source')].map(a=>({url:a.href,target:a.target,rel:a.rel,text:a.textContent})),iframes:e.querySelectorAll('iframe,video').length}));
    check('Noodle details use one historical original-platform link without embedded playback',detail.open&&detail.videos.length===1&&detail.videos[0].url==='https://www.bilibili.com/video/BV1wC4y1x7Wc/'&&detail.videos[0].text.includes('分店待核对')&&detail.iframes===0,detail);
    check('Clicking food card does not trigger underlying road selection',await page.evaluate(()=>window.__foodMapClicks===0&&window.foodCityMap.getStats().selectedRoad===null));
    await page.locator('.food-evidence summary').click();
    const disclosure=await page.locator('.food-evidence').innerText();
    check('Location and image evidence disclose unverified current address and AI illustration',disclosure.includes('店址')&&disclosure.includes('待核实')&&disclosure.includes('AI')&&disclosure.includes('不代表这家店的实际菜品')&&await page.locator('#food-hero .photo-note').innerText()==='菜品示意 · 非门店实拍',disclosure);
    await page.locator('#food-save').click();
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-detail.png'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#food-dialog').open);
    check('Esc closes details and returns focus to the originating card',await page.evaluate(()=>!document.querySelector('#food-dialog').open&&document.activeElement?.dataset.foodId==='osm-node-13649952401'));
    await page.getByRole('button',{name:'查看赵二火锅',exact:true}).click();
    check('Hotpot detail has no unrelated video link',await page.locator('#food-video-section').evaluate(e=>e.hidden)&&await page.locator('#food-videos a').count()===0);
    await page.locator('#food-save').click();await page.locator('#food-close').click();
    await page.locator('#wants-open').click();
    check('Two wants are ordered and distinct',await page.locator('#wants-list li').count()===2&&await page.evaluate(()=>new Set(window.foodCityMap.food.saved).size===2));
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-wants.png'});
    await page.locator('#wants-close').click();await page.reload();
    await page.waitForFunction(()=>window.foodCityMap?.ready);await page.locator('#food-entry').click();await page.waitForFunction(()=>window.foodCityMap.food.active);await settle();
    check('Wants survive page reload in this browser',await page.evaluate(()=>window.foodCityMap.food.saved.length===2&&document.querySelector('#wants-count').textContent==='2'));
    await page.locator('#wants-open').click();
    await page.getByRole('button',{name:'从想去移除超级李板凳面',exact:true}).click();
    check('Removing a want updates list, count and stored IDs',await page.locator('#wants-list li').count()===1&&await page.evaluate(()=>window.foodCityMap.food.saved.length===1&&JSON.parse(localStorage.getItem('foodcity:wants:chongqing:v1')).length===1&&document.querySelector('#wants-count').textContent==='1'));
    await page.locator('.want-item').click();
    check('Want reopens its own details',await page.locator('#food-dialog').evaluate(e=>e.open)&&await page.locator('#food-title').textContent()==='赵二火锅');
    await page.locator('#food-close').click();
    const rejection=await page.evaluate(()=>{
      const api=window.foodCityMap,r=api.food.records[0];
      return [{...r},{...r,verificationStatus:'verified',coordinateSystem:'GCJ02'}].map(record=>{let error;try{api.setFoodCards([record]);}catch(e){error=e.message;}return {error,count:api.getStats().foodCards};});
    });
    check('Verified-card API still rejects source records and GCJ02 without changing visible cards',rejection.every(r=>r.error&&r.count===2),rejection);
    report.viewports=[];
    for(const [width,height] of [[390,844],[320,680],[736,414]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>window.foodCityMap.food.activate());await settle();
      const metrics=await boxes();report.viewports.push(metrics);
      const firstRow=metrics.controls.filter(c=>c.name!=='×');
      check('Header and page fit '+width+'x'+height,metrics.scroll[0]===width&&metrics.scroll[1]===height&&firstRow.every(c=>c.box.left>=0&&c.box.right<=width),metrics);
      const rects=firstRow.map(c=>c.box);
      check('Header buttons do not overlap '+width+'x'+height,rects.every((r,i)=>rects.slice(i+1).every(s=>r.right<=s.left||s.right<=r.left||r.bottom<=s.top||s.bottom<=r.top)),firstRow);
      const cs=metrics.cards.filter(c=>!c.collapsed).map(c=>c.box);
      check('Expanded cards do not overlap '+width+'x'+height,cs.every((r,i)=>cs.slice(i+1).every(s=>r.right<=s.left||s.right<=r.left||r.bottom<=s.top||s.bottom<=r.top)),metrics.cards);
      await page.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();
      const opened=await boxes();
      check('Food dialog fits and scrolls inside '+width+'x'+height,opened.dialogs.every(r=>r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height),opened.dialogs);
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-'+width+'-detail.png'});
      await page.locator('#food-close').click();
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-qa-'+width+'.png'});
    }
    await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>window.foodCityMap.food.activate());await settle();
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-final-desktop.png'});
    await page.locator('#food-entry').click();
    check('Food toggle clears only food overlays and retains the base map',await page.evaluate(()=>!window.foodCityMap.food.active&&window.foodCityMap.getStats().foodCards===0&&window.foodCityMap.ready));
    report.network={external:requests.filter(u=>/^https?:/.test(u)&&new URL(u).origin!=='http://127.0.0.1:8791'),failed:responses.filter(r=>r.status>=400)};
    check('Self-hosted runtime has no external fetches, failed HTTP or browser errors',report.network.external.length===0&&report.network.failed.length===0&&report.pageErrors.length===0&&report.consoleErrors.length===0,report.network);
  }catch(error){report.issues.push('Execution error: '+error.message);}
  report.passed=report.issues.length===0;return report;
}
