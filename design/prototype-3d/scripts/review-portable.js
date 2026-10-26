async page => {
  const requests=[],issues=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>issues.push(e.message));
  const artifactURL='http://127.0.0.1:8787/preview.html';
  // Verify the exact self-contained artifact over the local QA server.
  // This does not claim that the browser automation supports the file: protocol.
  await page.goto(artifactURL);
  await page.setViewportSize({width:1440,height:960});
  await page.waitForFunction(()=>window.cityStudy?.getStats().firstFrameMs>0);
  const beforeZoom=await page.evaluate(()=>window.cityStudy.camera.position.distanceTo(window.cityStudy.controls.target));
  await page.getByRole('button',{name:'放大',exact:true}).click();
  await page.waitForFunction(d=>window.cityStudy.camera.position.distanceTo(window.cityStudy.controls.target)<d*.85,beforeZoom);
  const afterZoom=await page.evaluate(()=>window.cityStudy.camera.position.distanceTo(window.cityStudy.controls.target));
  await page.getByRole('button',{name:'江岸视角',exact:true}).click();
  await page.waitForFunction(()=>Math.abs(window.cityStudy.camera.position.y-330)<.1);
  const downloadReady=page.waitForEvent('download');
  const exported=await page.evaluate(()=>window.cityStudy.exportScene());
  const download=await downloadReady;
  await download.saveAs('D:/codex/美食网站/design/prototype-3d/models/chongqing-hongyadong-study.glb');
  const touchContext=await page.context().browser().newContext({viewport:{width:320,height:680},hasTouch:true,isMobile:true,deviceScaleFactor:1.5,reducedMotion:'reduce'});
  const touch=await touchContext.newPage();
  await touch.goto(artifactURL);
  await touch.waitForFunction(()=>window.cityStudy?.getStats().firstFrameMs>0);
  await touch.getByRole('button',{name:'查看模型与数据说明',exact:true}).tap();
  const touchResult=await touch.evaluate(()=>{
    const close=document.querySelector('#source-panel .close').getBoundingClientRect();
    const panel=document.querySelector('#source-panel').getBoundingClientRect();
    return {coarse:matchMedia('(pointer:coarse)').matches,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,close:[close.width,close.height],panel:[panel.left,panel.top,panel.right,panel.bottom],viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
  });
  await touch.screenshot({path:'D:/codex/美食网站/output/playwright/city3d-touch-source.png'});
  await touch.getByRole('button',{name:'关闭模型说明',exact:true}).tap();
  await touch.getByRole('button',{name:'俯瞰街区',exact:true}).tap();
  await touch.waitForFunction(()=>Math.abs(window.cityStudy.camera.position.y-1600)<.1);
  await touchContext.close();
  await page.getByRole('button',{name:'美食卡片',exact:true}).click();
  await page.screenshot({path:'D:/codex/美食网站/output/playwright/city3d-model-final.png'});
  const subresourceRequests=requests.filter(u=>/^https?:/.test(u)&&u!==artifactURL);
  if(subresourceRequests.length||issues.length)throw new Error(JSON.stringify({subresourceRequests,issues}));
  return {standalone:{transport:'local HTTP',title:await page.title(),subresourceRequests,issues},zoom:{beforeZoom,afterZoom},exported,touchResult};
}
