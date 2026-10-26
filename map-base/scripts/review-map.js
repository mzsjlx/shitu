async page => {
  const baseURL='http://127.0.0.1:8791/';
  const origin=new URL(baseURL).origin;
  const report={scope:'Local browser QA of real-map base; no publication or real merchant claim.',viewport:[1440,960],checks:[],issues:[],requests:[],responses:[],pageErrors:[],consoleErrors:[]};
  const recordContext=context=>{
    context.on('request',request=>report.requests.push(request.url()));
    context.on('response',response=>report.responses.push({url:response.url(),status:response.status()}));
  };
  const recordPage=target=>{
    target.on('pageerror',error=>report.pageErrors.push(error.message));
    target.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  };
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const settle=async target=>{
    await target.waitForFunction(()=>{const m=window.foodCityMap?.map;return m&&!m.isMoving()&&m.areTilesLoaded();},{},{timeout:20000});
    await target.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  const viewportMetrics=target=>target.evaluate(()=>{
    const d=document.documentElement,map=document.querySelector('.map-shell');
    const box=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const visible=selector=>[...document.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>({id:e.id,box:box(e)}));
    return {viewport:[innerWidth,innerHeight],scroll:[d.scrollWidth,d.scrollHeight],mapScroll:[map.scrollLeft,map.scrollTop],dock:box(document.querySelector('.view-dock')),floating:visible('#layers-panel,#road-info,#search-results,dialog[open]')};
  });
  let touchContext;
  recordContext(page.context());recordPage(page);
  page.setDefaultTimeout(20000);
  try {
    await page.setViewportSize({width:1440,height:960});
    await page.goto(baseURL);
    await page.waitForFunction(()=>window.foodCityMap?.ready===true);
    await settle(page);
    report.initial=await page.evaluate(()=>window.foodCityMap.getStats());
    check('initializes with real roads and nonzero terrain',report.initial.ready&&report.initial.renderedRoadFragments>0&&report.initial.elevationMetres>0,report.initial);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/real-map-qa-desktop.png'});

    report.search=[];
    for(const name of ['沧白路','千厮门大桥']) {
      await page.locator('#search-input').fill(name);
      const result=page.locator('#search-results button').filter({hasText:name}).first();
      await result.click();
      await page.waitForFunction(name=>window.foodCityMap.getStats().selectedRoad===name,name);
      await settle(page);
      const found=await page.evaluate(()=>{
        const api=window.foodCityMap,m=api.map;
        return {selected:api.getStats().selectedRoad,title:document.querySelector('#road-title').textContent,filter:m.getFilter('selected-road'),renderedHighlights:m.queryRenderedFeatures({layers:['selected-road']}).length,center:m.getCenter().toArray()};
      });
      report.search.push({name,...found});
      check('search and highlight '+name,found.selected===name&&found.title===name&&JSON.stringify(found.filter).includes(name)&&found.renderedHighlights>0,found);
    }
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/real-map-qa-selected-bridge.png'});

    await page.locator('#view-2d').click();
    await page.waitForFunction(()=>Math.abs(window.foodCityMap.map.getPitch())<.01);
    const flat=await page.evaluate(()=>({pitch:window.foodCityMap.map.getPitch(),buildingVisibility:window.foodCityMap.map.getLayoutProperty('buildings-3d','visibility'),pressed:document.querySelector('#view-2d').getAttribute('aria-pressed')}));
    check('2D view changes camera and hides extrusions',flat.pitch<.01&&flat.buildingVisibility==='none'&&flat.pressed==='true',flat);
    await page.locator('#view-3d').click();
    await page.waitForFunction(()=>Math.abs(window.foodCityMap.map.getPitch()-window.foodCityMap.city.pitch)<.01);
    check('3D view restores pitch',true,await page.evaluate(()=>window.foodCityMap.map.getPitch()));

    await page.locator('#layers-toggle').click();
    report.toggles=[];
    for(const [id,read] of [
      ['labels-option',()=>window.foodCityMap.map.getLayoutProperty('road-labels-major','visibility')==='none'&&window.foodCityMap.map.getLayoutProperty('road-labels-minor','visibility')==='none'],
      ['buildings-option',()=>window.foodCityMap.map.getLayoutProperty('buildings-3d','visibility')==='none'],
      ['terrain-option',()=>window.foodCityMap.map.getTerrain()===null]
    ]) {
      await page.locator('#'+id).uncheck();
      const applied=await page.evaluate(read);
      check(id+' disables corresponding layer',applied);
      await page.locator('#'+id).check();
      report.toggles.push({id,offApplied:applied});
    }
    await page.locator('#layers-close').click();
    await settle(page);
    await page.locator('#reset-view').click();await settle(page);
    const beforeZoom=await page.evaluate(()=>window.foodCityMap.map.getZoom());
    await page.locator('.maplibregl-ctrl-zoom-in').click();
    await page.waitForFunction(z=>window.foodCityMap.map.getZoom()>z+.4,beforeZoom);await settle(page);
    const afterZoom=await page.evaluate(()=>window.foodCityMap.map.getZoom());
    check('zoom control changes geographic scale',afterZoom>beforeZoom+.4,{beforeZoom,afterZoom});
    const beforeBearing=await page.evaluate(()=>window.foodCityMap.map.getBearing());
    const canvas=await page.locator('.maplibregl-canvas').boundingBox();
    await page.mouse.move(canvas.x+canvas.width*.5,canvas.y+canvas.height*.52);
    await page.mouse.down({button:'right'});
    await page.mouse.move(canvas.x+canvas.width*.65,canvas.y+canvas.height*.48,{steps:12});
    await page.mouse.up({button:'right'});await settle(page);
    const afterBearing=await page.evaluate(()=>window.foodCityMap.map.getBearing());
    check('pointer rotation changes map bearing',Math.abs(afterBearing-beforeBearing)>5,{beforeBearing,afterBearing});

    await page.locator('#about-map').click();
    const dialogOpen=await page.locator('#source-dialog').evaluate(e=>e.open);
    await page.keyboard.press('Escape');
    const dialogClosed=await page.locator('#source-dialog').evaluate(e=>!e.open);
    const focusReturned=await page.evaluate(()=>document.activeElement.id==='about-map');
    check('source dialog closes with Esc and restores focus',dialogOpen&&dialogClosed&&focusReturned,{dialogOpen,dialogClosed,focusReturned});

    await page.locator('#reset-view').click();await settle(page);
    const cardResult=await page.evaluate(()=>{
      const api=window.foodCityMap;
      window.__mapQAClicks=[];
      const fixture={id:'qa-anchor-only',name:'QA 测试锚点（非门店）',coordinateSystem:'WGS84',verificationStatus:'verified',coordinates:[106.574,29.5628]};
      api.setFoodCards([fixture],item=>window.__mapQAClicks.push(item.id));
      return {input:fixture.coordinates,count:api.getStats().foodCards,mapSelectedBefore:api.getStats().selectedRoad};
    });
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const readCardAnchor=()=>{
      const api=window.foodCityMap,expected=[106.574,29.5628],p=api.map.project(expected);
      const r=document.querySelector('.food-card').getBoundingClientRect(),container=api.map.getContainer().getBoundingClientRect();
      const pixel=[r.left+r.width/2-container.left,r.bottom+14-container.top];
      return {input:expected,projectedPixel:[p.x,p.y],domAnchorPixel:pixel,pixelError:Math.hypot(pixel[0]-p.x,pixel[1]-p.y),unprojectedCoordinates:api.map.unproject(pixel).toArray(),count:api.getStats().foodCards};
    };
    cardResult.anchor=await page.evaluate(readCardAnchor);
    await page.evaluate(()=>{const m=window.foodCityMap.map;m.jumpTo({center:[106.5747,29.5631],zoom:m.getZoom()+.35,bearing:m.getBearing()+12});});await settle(page);
    const cardMoved=await page.evaluate(readCardAnchor);
    const sameAnchor=cardResult.anchor.pixelError<1.5&&cardMoved.pixelError<1.5;
    await page.getByRole('button',{name:'查看QA 测试锚点（非门店）',exact:true}).click();
    const clickResult=await page.evaluate(()=>({clicked:window.__mapQAClicks.includes('qa-anchor-only'),mapSelectedAfter:window.foodCityMap.getStats().selectedRoad}));
    const clicked=clickResult.clicked;
    check('food-card click does not select the underlying road',clickResult.mapSelectedAfter===cardResult.mapSelectedBefore,{before:cardResult.mapSelectedBefore,after:clickResult.mapSelectedAfter});
    await page.evaluate(()=>window.foodCityMap.clearFoodCards());
    const cleared=await page.evaluate(()=>window.foodCityMap.getStats().foodCards===0&&document.querySelectorAll('.food-card').length===0);
    check('WGS84 card anchor survives pan/zoom, opens and clears',cardResult.count===1&&cardMoved.count===1&&sameAnchor&&clicked&&cleared,{before:cardResult,after:cardMoved,sameAnchor,clicked,cleared});
    const rejected=await page.evaluate(()=>{
      const api=window.foodCityMap,base={id:'qa-invalid',name:'QA 无效卡片（非门店）',coordinates:[106.574,29.5628],coordinateSystem:'WGS84',verificationStatus:'verified'};
      const cases=[{label:'unverified',patch:{verificationStatus:'pending'}},{label:'GCJ02',patch:{coordinateSystem:'GCJ02'}}];
      return cases.map(({label,patch})=>{let error=null;try{api.setFoodCards([{...base,...patch}]);}catch(e){error=e.message;}return {label,error,count:api.getStats().foodCards,invalidDOM:document.querySelectorAll('.food-card').length};});
    });
    check('unverified and GCJ02 cards are rejected without display',rejected.every(r=>r.error&&r.count===0&&r.invalidDOM===0),rejected);

    report.sizes=[];
    for(const [width,height] of [[390,844],[320,680],[736,414]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const dockText=await page.locator('.view-dock').evaluate(dock=>[...dock.querySelectorAll('button')].map(button=>{const range=document.createRange();range.selectNodeContents(button);return {text:button.textContent,lineBoxes:range.getClientRects().length};}));
      check('view control labels do not wrap '+width+'x'+height,dockText.every(item=>item.lineBoxes===1),dockText);
      await page.locator('#layers-toggle').click();
      let metrics=await viewportMetrics(page);
      check('viewport and layers fit '+width+'x'+height,metrics.scroll[0]<=width&&metrics.scroll[1]<=height&&metrics.mapScroll.every(n=>n===0)&&metrics.floating.every(f=>f.box.left>=-1&&f.box.top>=-1&&f.box.right<=width+1&&f.box.bottom<=height+1),metrics);
      await page.locator('#layers-close').click();
      await page.locator('#about-map').click();
      metrics=await viewportMetrics(page);
      check('source dialog fits '+width+'x'+height,metrics.floating.every(f=>f.box.left>=-1&&f.box.top>=-1&&f.box.right<=width+1&&f.box.bottom<=height+1),metrics);
      await page.keyboard.press('Escape');
      report.sizes.push(metrics);
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/real-map-qa-'+width+'.png'});
    }

    touchContext=await page.context().browser().newContext({viewport:{width:320,height:680},hasTouch:true,isMobile:true,deviceScaleFactor:1.5,reducedMotion:'reduce'});
    recordContext(touchContext);
    const touch=await touchContext.newPage();recordPage(touch);
    await touch.goto(baseURL);await touch.waitForFunction(()=>window.foodCityMap?.ready===true);await settle(touch);
    await touch.locator('#view-2d').tap();
    await touch.waitForFunction(()=>window.foodCityMap.map.getPitch()<.01);
    await touch.locator('#view-3d').tap();
    await touch.waitForFunction(()=>Math.abs(window.foodCityMap.map.getPitch()-window.foodCityMap.city.pitch)<.01);
    await touch.locator('#about-map').tap();
    report.touch=await touch.evaluate(()=>{const r=document.querySelector('#source-close').getBoundingClientRect();return {coarse:matchMedia('(pointer:coarse)').matches,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,close:[r.width,r.height],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],pitch:window.foodCityMap.map.getPitch()};});
    check('touch and reduced-motion view controls work',report.touch.coarse&&report.touch.reduced&&report.touch.close.every(n=>n>=44)&&report.touch.scroll[0]===320&&report.touch.scroll[1]===680,report.touch);
    await touch.screenshot({path:'D:/codex/美食网站/output/playwright/real-map-qa-touch-source.png'});
    await touchContext.close();touchContext=null;
    await page.setViewportSize({width:1440,height:960});
    await page.locator('#reset-view').click();await settle(page);
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/real-map-qa-final.png'});
  } catch(error) {
    report.issues.push('QA execution error: '+error.message);
  } finally {
    if(touchContext)await touchContext.close();
    await page.evaluate(()=>window.foodCityMap?.clearFoodCards()).catch(()=>{});
  }
  const external=report.requests.filter(url=>/^https?:/.test(url)&&new URL(url).origin!==origin);
  const failedHTTP=report.responses.filter(response=>response.status>=400);
  const rangeResponses=report.responses.filter(response=>response.url.includes('.pmtiles'));
  const demResponses=report.responses.filter(response=>response.url.includes('/terrain/'));
  report.network={requests:report.requests.length,uniqueURLs:[...new Set(report.requests)],external,failedHTTP,pmtilesStatuses:[...new Set(rangeResponses.map(r=>r.status))],pmtilesResponses:rangeResponses.length,demResponses:demResponses.length,demFailures:demResponses.filter(r=>r.status>=400)};
  check('runtime uses only self-hosted resources',external.length===0,{external});
  check('PMTiles HTTP Range returns 206',rangeResponses.length>0&&rangeResponses.some(r=>r.status===206),report.network.pmtilesStatuses);
  check('DEM requests complete without missing tiles',demResponses.length>0&&report.network.demFailures.length===0,{demResponses:demResponses.length,failures:report.network.demFailures});
  check('no page errors, console errors or failed HTTP',report.pageErrors.length===0&&report.consoleErrors.length===0&&failedHTTP.length===0,{pageErrors:report.pageErrors,consoleErrors:report.consoleErrors,failedHTTP});
  report.passed=report.issues.length===0;
  delete report.requests;delete report.responses;
  return report;
}
