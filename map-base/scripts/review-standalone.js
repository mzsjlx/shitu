async page => {
  const requests=[],errors=[],warnings=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  const url='http://127.0.0.1:8791/preview.html';
  await page.setViewportSize({width:1440,height:960});
  await page.goto(url);
  await page.waitForFunction(()=>window.foodCityMap?.ready,undefined,{timeout:30000});
  const stats=await page.evaluate(()=>window.foodCityMap.getStats());
  if(!stats.terrain||!(stats.elevationMetres>0)||stats.renderedRoadFragments<1)throw new Error('Standalone geographic data missing');
  await page.screenshot({path:'output/playwright/real-map-final.png'});
  await page.getByRole('textbox',{name:'搜索重庆道路',exact:true}).fill('千厮门大桥');
  await page.getByRole('textbox',{name:'搜索重庆道路',exact:true}).press('Enter');
  await page.waitForFunction(()=>!window.foodCityMap.map.isMoving()&&window.foodCityMap.map.areTilesLoaded());
  if(await page.locator('#road-title').textContent()!=='千厮门大桥')throw new Error('Standalone road search failed');
  await page.screenshot({path:'output/playwright/real-map-road-selected.png'});
  await page.getByRole('button',{name:'2D 看路',exact:true}).click();
  await page.waitForFunction(()=>window.foodCityMap.map.getPitch()<.1&&!window.foodCityMap.map.isMoving());
  await page.screenshot({path:'output/playwright/real-map-2d.png'});
  const additionalHttpRequests=requests.filter(u=>/^https?:/.test(u)&&u!==url);
  if(additionalHttpRequests.length||errors.length)throw new Error(JSON.stringify({additionalHttpRequests,errors}));
  return {transport:'HTTP serving exact standalone artifact',stats,roadSearch:'千厮门大桥',additionalHttpRequests,errors,warnings};
}
