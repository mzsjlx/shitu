async page => {
  const issues=[];
  page.on('pageerror',e=>issues.push(e.message));
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')issues.push(m.type()+': '+m.text());});
  await page.setViewportSize({width:1440,height:960});
  await page.reload();
  await page.waitForFunction(()=>window.cityStudy?.getStats().firstFrameMs>0);
  await page.screenshot({path:'output/playwright/city3d-desktop.png'});
  const stats=await page.evaluate(()=>window.cityStudy.getStats());
  await page.getByRole('button',{name:'美食卡片',exact:true}).click();
  await page.screenshot({path:'output/playwright/city3d-model.png'});
  const performance=await page.evaluate(async()=>{
    const s=window.cityStudy,periods=[];
    let previous=await new Promise(requestAnimationFrame);
    for(let i=0;i<70;i++){
      const target=s.controls.target,delta=s.camera.position.clone().sub(target);
      delta.applyAxisAngle(s.camera.up,.003);s.camera.position.copy(delta.add(target));s.controls.update();s.render();
      const now=await new Promise(requestAnimationFrame);
      if(i>9)periods.push(now-previous);previous=now;
    }
    const sorted=[...periods].sort((a,b)=>a-b),mean=periods.reduce((a,b)=>a+b,0)/periods.length;
    return {samples:periods.length,meanFrameMs:+mean.toFixed(2),medianFrameMs:+sorted[Math.floor(sorted.length*.5)].toFixed(2),p95FrameMs:+sorted[Math.floor(sorted.length*.95)].toFixed(2),meanFps:+(1000/mean).toFixed(1),devicePixelRatio:devicePixelRatio};
  });
  await page.getByRole('button',{name:'俯瞰街区',exact:true}).click();
  await page.waitForFunction(()=>Math.abs(window.cityStudy.camera.position.y-1600)<.1);
  await page.screenshot({path:'output/playwright/city3d-overhead.png'});
  await page.getByRole('button',{name:'江岸视角',exact:true}).click();
  await page.waitForFunction(()=>Math.abs(window.cityStudy.camera.position.y-330)<.1);
  const before=await page.evaluate(()=>window.cityStudy.camera.position.toArray());
  await page.getByRole('button',{name:'向右旋转视角',exact:true}).click();
  await page.waitForFunction(before=>Math.abs(window.cityStudy.camera.position.x-before[0])>100,before);
  const after=await page.evaluate(()=>window.cityStudy.camera.position.toArray());
  await page.evaluate(()=>window.cityStudy.orbit(Math.PI));
  await page.waitForFunction(()=>window.cityStudy.camera.position.z>200);
  await page.screenshot({path:'output/playwright/city3d-reverse.png'});
  await page.getByRole('button',{name:'查看模型与数据说明',exact:true}).click();
  const sourceVisible=await page.getByRole('heading',{name:'真实位置，定制画面。'}).isVisible();
  await page.keyboard.press('Escape');
  const escapeClosed=await page.locator('#source-panel').isHidden();
  await page.getByRole('button',{name:'江岸视角',exact:true}).click();
  await page.waitForFunction(()=>Math.abs(window.cityStudy.camera.position.y-330)<.1);
  await page.getByRole('button',{name:'美食卡片',exact:true}).click();
  const card=page.getByRole('button',{name:'查看山城火锅概念卡片',exact:true});
  await card.click();
  const detailVisible=await page.locator('#food-detail').isVisible();
  await page.getByRole('button',{name:'继续看城',exact:true}).click();
  const detailClosed=await page.locator('#food-detail').isHidden();
  const sizes=[];
  for(const [width,height] of [[390,844],[320,680],[736,414]]){
    await page.setViewportSize({width,height});
    await page.evaluate(async()=>{window.cityStudy.render();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    const dimensions=await page.evaluate(()=>{
      const d=document.documentElement,b=document.querySelector('.view-dock').getBoundingClientRect(),scene=document.querySelector('#scene');
      const bubbles=[...document.querySelectorAll('.food-pin[data-occluded="false"] .food-bubble')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
      return {viewport:[innerWidth,innerHeight],scroll:[d.scrollWidth,d.scrollHeight],sceneScroll:[scene.scrollLeft,scene.scrollTop],dock:[b.left,b.right,b.top,b.bottom],bubbles};
    });
    sizes.push(dimensions);
    await page.screenshot({path:`output/playwright/city3d-${width}.png`});
  }
  if(sizes.some(s=>s.scroll[0]>s.viewport[0]||s.scroll[1]>s.viewport[1]||s.sceneScroll.some(n=>n!==0)||Math.abs((s.dock[0]+s.dock[1])/2-s.viewport[0]/2)>1))throw new Error('Viewport or focus-scroll regression');
  if(!sourceVisible||!escapeClosed||!detailVisible||!detailClosed||issues.length)throw new Error(JSON.stringify({sourceVisible,escapeClosed,detailVisible,detailClosed,issues}));
  await page.setViewportSize({width:1440,height:960});
  return {stats,performance,rotate:{before,after},sourceVisible,escapeClosed,detailVisible,detailClosed,sizes,issues};
}
