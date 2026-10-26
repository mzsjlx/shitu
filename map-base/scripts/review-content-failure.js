async page=>{
  const key='foodcity:content-review:chongqing:v1',url='http://127.0.0.1:8791/content-review.html';
  const report={date:'2026-10-23',scope:'Local content-tool failure paths, not real merchant verification.',checks:[],issues:[]};
  async function run(name,body){const context=await page.context().browser().newContext({viewport:{width:1280,height:850}}),p=await context.newPage();try{const details=await body(p);report.checks.push({name,passed:details.passed,...details});if(!details.passed)report.issues.push(name);}catch(e){report.checks.push({name,passed:false,error:e.message});report.issues.push(name);}finally{await context.close();}}
  await run('Catalog HTTP failure shows recovery and leaves draft untouched',async p=>{
    await p.addInitScript(k=>localStorage.setItem(k,'retained-test-value'),key);
    await p.route('**/data/content-review-catalog.json',r=>r.fulfill({status:503,body:'Expected QA failure'}));await p.goto(url);
    await p.waitForFunction(()=>document.querySelector('#review-load-state').textContent.includes('暂未准备好'));
    const state=await p.evaluate(k=>({message:document.querySelector('#review-load-state').textContent,hidden:document.querySelector('#workbench').hidden,exportDisabled:document.querySelector('#export-draft').disabled,stored:localStorage.getItem(k)}),key);
    return {passed:state.hidden&&state.exportDisabled&&state.stored==='retained-test-value',state};
  });
  await run('Missing script does not leave endless preparation text',async p=>{
    await p.route('**/review-app.js',r=>r.abort());await p.goto(url);await p.waitForFunction(()=>document.querySelector('#review-load-state').textContent.includes('暂未读取'));
    return {passed:await p.locator('#workbench').evaluate(e=>e.hidden),message:await p.locator('#review-load-state').textContent()};
  });
  await run('Storage quota failure keeps typed text and reports not saved',async p=>{
    await p.addInitScript(k=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===k)throw new DOMException('QA storage quota','QuotaExceededError');return original.call(this,name,value);};},key);
    await p.goto(url);await p.locator('#workbench').waitFor({state:'visible'});await p.locator('#field-branch-address').fill('QA 合成门牌，非真实核实');
    const state=await p.evaluate(()=>({message:document.querySelector('#save-status').textContent,feedback:document.querySelector('#review-feedback').textContent,value:document.querySelector('#field-branch-address').value}));
    await p.screenshot({path:'D:/codex/美食网站/output/playwright/content-storage-failure.png'});
    return {passed:state.message.includes('尚未保存')&&state.feedback.includes('未成功')&&state.value.includes('QA 合成'),state};
  });
  await run('Corrupt previous draft is not silently overwritten by new edits',async p=>{
    await p.addInitScript(k=>localStorage.setItem(k,'{invalid-draft'),key);await p.goto(url);await p.locator('#workbench').waitFor({state:'visible'});
    await p.locator('#field-branch-address').fill('QA 内存草稿');
    const state=await p.evaluate(k=>({stored:localStorage.getItem(k),message:document.querySelector('#save-status').textContent,feedback:document.querySelector('#review-feedback').textContent,value:document.querySelector('#field-branch-address').value}),key);
    return {passed:state.stored==='{invalid-draft'&&state.message.includes('尚未保存')&&state.feedback.includes('不可读取')&&state.value==='QA 内存草稿',state};
  });
  report.passed=report.issues.length===0;return report;
}
