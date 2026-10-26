async page=>{
  const report={date:'2026-10-24',scope:'Synthetic renderer video-link inputs in an isolated browser context; no external navigation or real content verification.',checks:[],issues:[]};
  const context=await page.context().browser().newContext({viewport:{width:1200,height:800},reducedMotion:'reduce'}),qa=await context.newPage();
  const external=[];qa.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8791/'))external.push(r.url());});
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  try{
    await qa.goto('http://127.0.0.1:8791/?view=food');await qa.waitForFunction(()=>window.foodCityMap?.food?.active);
    const result=await qa.evaluate(()=>{
      const app=window.foodCityMap,fixture={...app.food.records[0],id:'synthetic-video-input-qa',name:'合成链接检查 · 非实际门店核实',verificationStatus:'verified'};
      const bad=['javascript:alert(1)','http://example.com/video','data:text/plain,video','file:///C:/clip.mp4','https://user:password@example.com/watch','not-a-url'];
      const rejected=bad.map(url=>{app.setFoodCards([{...fixture,videos:[{url}]}]);return {url,links:document.querySelectorAll('.food-original-video').length};});
      const malformed=[null,{},'https://example.com/not-a-list',[null,{}, {url:5}]].map(videos=>{app.setFoodCards([{...fixture,videos}]);return document.querySelectorAll('.food-original-video').length;});
      app.setFoodCards([{...fixture,videos:[{url:'http://example.com/bad'},{url:'https://example.com/related-video',publishedOn:'2020-01-01',title:'Synthetic related source'}]}]);
      const link=document.querySelector('.food-original-video'),fallback={href:link?.href,title:link?.title,label:link?.getAttribute('aria-label'),quickSaves:document.querySelectorAll('.food-quick-save').length};
      app.clearFoodCards();return {rejected,malformed,fallback,remaining:document.querySelectorAll('.food-card').length};
    });
    check('Invalid protocols, credentials and malformed URLs do not render an original-video link',result.rejected.every(r=>r.links===0),result.rejected);
    check('Absent or malformed video lists do not throw or render links',result.malformed.every(n=>n===0),result.malformed);
    check('First valid HTTPS video after invalid entries keeps caveat and no private save callback',result.fallback.href==='https://example.com/related-video'&&result.fallback.title.includes('分店待核')&&result.fallback.label.includes('分店待核')&&result.fallback.quickSaves===0,result.fallback);
    check('Clearing cards removes both main and action controls without external prefetch',result.remaining===0&&external.length===0,{remaining:result.remaining,external});
  }catch(e){report.issues.push(e.message);}finally{await context.close();}
  report.passed=report.issues.length===0;return report;
}
