async page=>{
  const url='http://127.0.0.1:8791/preview.html?view=street';
  const requests=[],errors=[];
  page.on('request',request=>requests.push(request.url()));
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:960});
  await page.goto(url);
  await page.waitForFunction(()=>{
    const a=window.foodCityMap;
    return a?.ready&&a.street?.getStats().active&&!a.map.isMoving()&&a.map.isSourceLoaded('street-detail')&&a.map.areTilesLoaded();
  },undefined,{timeout:25000});
  const stats=await page.evaluate(()=>({base:window.foodCityMap.getStats(),street:window.foodCityMap.street.getStats()}));
  if(stats.street.renderedFeatures<1)throw new Error('Standalone street features are absent');
  const additionalHTTP=requests.filter(request=>/^https?:/.test(request)&&request!==url);
  if(additionalHTTP.length||errors.length)throw new Error(JSON.stringify({additionalHTTP,errors}));
  await page.screenshot({path:'D:/codex/美食网站/output/playwright/street-final-desktop.png'});
  return {date:'2026-10-22',transport:'HTTP serving exact embedded HTML',stats,additionalHTTP,errors,passed:true};
}
