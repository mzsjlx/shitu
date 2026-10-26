async page=>{
  await page.waitForFunction(()=>window.foodCityMap?.street?.getStats().phase==='loaded');
  const views=[
    {name:'small-shizi',center:[106.58012705,29.562860625],zoom:18.55,pitch:40,bearing:-18},
    {name:'north-crossing',center:[106.57328797,29.5727354],zoom:18.55,pitch:40,bearing:-18}
  ];
  const output=[];
  for(const view of views){
    await page.evaluate(v=>window.foodCityMap.map.jumpTo(v),view);
    await page.waitForFunction(()=>window.foodCityMap.map.areTilesLoaded());
    await page.screenshot({path:'D:/codex/美食网站/output/playwright/street-'+view.name+'.png'});
    output.push({name:view.name,stats:await page.evaluate(()=>window.foodCityMap.street.getStats())});
  }
  return output;
}
