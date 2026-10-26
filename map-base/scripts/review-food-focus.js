async page=>{
  const report={date:'2026-10-22',scope:'Regression after explicit dialog focus restoration; current build and exact standalone HTML.',checks:[],issues:[]};
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  try{
    await page.setViewportSize({width:1440,height:960});await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:8791/?view=food');
    await page.waitForFunction(()=>window.foodCityMap?.food?.active&&!window.foodCityMap.map.isMoving());
    for(const [name,close] of [['Esc','Escape'],['Close button',null]]){
      await page.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();
      if(close)await page.keyboard.press(close);else await page.locator('#food-close').click();
      await page.waitForFunction(()=>!document.querySelector('#food-dialog').open&&document.activeElement?.dataset.foodId==='osm-node-13649952401');
      check(name+' restores focus to originating food card',true);
    }
    await page.locator('#wants-open').click();await page.locator('#wants-close').click();
    await page.waitForFunction(()=>!document.querySelector('#wants-dialog').open&&document.activeElement.id==='wants-open');
    check('Closing wants restores focus to wants entry',true);
    await page.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-final-detail.png'});
    await page.locator('#food-close').click();
    for(const [width,height] of [[390,844],[320,680]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>window.foodCityMap.food.activate());
      await page.waitForFunction(()=>!window.foodCityMap.map.isMoving());
      await page.getByRole('button',{name:'查看超级李板凳面',exact:true}).click();await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('#food-dialog').open&&document.activeElement?.dataset.foodId==='osm-node-13649952401');
      const bounds=await page.evaluate(()=>({scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],cards:[...document.querySelectorAll('.food-card')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,collapsed:e.classList.contains('is-collapsed')};})}));
      check('Mobile focus restores without page overflow '+width,bounds.scroll[0]===width&&bounds.scroll[1]===height,bounds);
      const collisions=await page.evaluate(()=>{
        const controls=[...document.querySelectorAll('.maplibregl-ctrl-top-right,.view-dock')].map(e=>e.getBoundingClientRect());
        return [...document.querySelectorAll('.food-card:not(.is-collapsed)')].filter(e=>{const r=e.getBoundingClientRect();return controls.some(p=>r.left<p.right&&r.right>p.left&&r.top<p.bottom&&r.bottom>p.top);}).map(e=>e.dataset.foodId);
      });
      check('Mobile photo cards leave map controls clear '+width,collisions.length===0,{collisions});
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-final-'+width+'.png'});
    }
    await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>window.foodCityMap.food.activate());
    await page.waitForFunction(()=>!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded());
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/food-final-desktop.png'});
    const p=await page.context().newPage(),url='http://127.0.0.1:8791/preview.html?view=food',requests=[],errors=[];
    try{
      p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
      await p.setViewportSize({width:1440,height:960});await p.goto(url);
      await p.waitForFunction(()=>window.foodCityMap?.food?.active&&!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded());
      const result=await p.evaluate(async()=>{const a=window.foodCityMap,im=new Image();im.src=a.food.records[0].spriteURL;await im.decode();return {cards:a.getStats().foodCards,routeEligible:a.food.records.map(r=>r.routeEligible),imageWidth:im.naturalWidth};});
      const extra=requests.filter(u=>/^https?:/.test(u)&&u!==url);
      check('Final standalone HTML embeds food, disclosure data and decodable image',result.cards===2&&result.routeEligible.every(x=>x===false)&&result.imageWidth===2172&&extra.length===0&&errors.length===0,{...result,additionalHTTP:extra,errors});
    }finally{await p.close();}
  }catch(e){report.issues.push(e.message);}
  report.passed=report.issues.length===0;return report;
}
