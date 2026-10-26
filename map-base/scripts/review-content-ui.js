async page=>{
  const report={date:'2026-10-23',scope:'Content workbench browser simulation using synthetic draft labels only; no real field verification, no public map changes.',checks:[],issues:[],pageErrors:[],consoleErrors:[]};
  const key='foodcity:content-review:chongqing:v1',wants='foodcity:wants:chongqing:v1',base='http://127.0.0.1:8791/content-review.html';
  page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
  const ready=()=>page.waitForFunction(()=>!document.querySelector('#workbench').hidden);
  const stored=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  const upload=async obj=>{await page.locator('#import-file').setInputFiles({name:'synthetic-content-qa.json',mimeType:'application/json',buffer:Buffer.from(typeof obj==='string'?obj:JSON.stringify(obj))});};
  const metrics=()=>page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};};
    return {viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,...rect(e)})),outside:[...document.querySelectorAll('main input,main select,main textarea,header button,header a')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,...rect(e)})).filter(r=>r.left<-.5||r.right>innerWidth+.5)};
  });
  try{
    await page.setViewportSize({width:1440,height:960});await page.goto(base);await ready();
    await page.evaluate(({key,wants})=>{localStorage.removeItem(key);localStorage.setItem(wants,JSON.stringify(['synthetic-want-untouched']));localStorage.setItem('content-qa-unrelated','synthetic-untouched');},{key,wants});await page.reload();await ready();
    check('Initial workbench has two separate candidates and 64/22/0 audit counts',await page.locator('#candidate-list button').count()===2&&(await page.locator('#audit-summary').innerText()).includes('64条餐饮线索 · 22个入口点 · 0个明确对应'));
    await page.locator('#audit-open').click();
    check('Audit dialog lists all 64 food source objects and labels non-matches',await page.locator('#audit-foods tr').count()===64&&(await page.locator('#audit-details').innerText()).includes('完整候选为0个')&&await page.locator('#audit-foods tr').evaluateAll(rows=>rows.every(r=>r.lastElementChild.textContent==='未建立')));
    await page.locator('#audit-close').click();
    const firstID=await page.locator('#candidate-list button[aria-pressed=true]').getAttribute('data-candidate');
    await page.locator('#field-branch-address').fill('合成QA草稿地址 · 不是现场核实');
    await page.locator('#field-branch-matchNote').fill('合成QA分店匹配说明，仅用于界面测试，未核实任何实际门店。');
    await page.locator('#field-checks-branch-conclusion').selectOption('supported');
    const branchDraft=await stored();
    check('Branch edits autosave without changing entrance or connection conclusions',branchDraft.records.find(r=>r.candidateId===firstID).branch.address==='合成QA草稿地址 · 不是现场核实'&&branchDraft.records.find(r=>r.candidateId===firstID).checks.entrance.conclusion==='needs-evidence'&&branchDraft.records.find(r=>r.candidateId===firstID).checks.connection.conclusion==='needs-evidence');
    await page.locator('#candidate-list button').nth(1).click();
    check('Editing one candidate does not edit the other',await page.locator('#field-branch-address').inputValue()==='');
    await page.locator('#candidate-list button').first().click();await page.reload();await ready();
    check('Branch draft survives browser reload and public status remains candidate',await page.locator('#field-branch-address').inputValue()==='合成QA草稿地址 · 不是现场核实'&&(await page.locator('.identity').innerText()).includes('来源候选 · 入口待核 · 未用于到店路线'));
    await page.locator('#tab-evidence').click();await page.locator('#add-evidence').click();
    const htmlTitle='合成QA材料 <img src=x onerror="window.__contentQAInjected=true">';
    await page.locator('#evidence-title').fill(htmlTitle);await page.locator('#evidence-reference').fill('合成QA本地说明.txt · 非门店证据');await page.locator('#evidence-note').fill('合成材料，仅验证界面保存、引用和导出。');await page.locator('#evidence-observed').fill('2026-10-23');
    await page.locator('#evidence-form button[type=submit]').click();
    const newEvidence=(await stored()).records.find(r=>r.candidateId===firstID).evidence.at(-1);
    check('Adding evidence stores its exact text without interpreting HTML',await page.locator('#evidence-list h3').last().textContent()===htmlTitle&&await page.locator('#evidence-list img').count()===0&&await page.evaluate(()=>window.__contentQAInjected!==true),newEvidence);
    await page.locator('#tab-checks').click();await page.locator('details[data-dimension=branch]').evaluate(e=>e.open=true);
    await page.locator('input[data-dimension=branch][data-evidence="'+newEvidence.id+'"]').check();
    check('An added material can be cited independently by one check',((await stored()).records.find(r=>r.candidateId===firstID).checks.branch.evidenceIds).includes(newEvidence.id)&&!((await stored()).records.find(r=>r.candidateId===firstID).checks.entrance.evidenceIds).includes(newEvidence.id));
    const downloadPromise=page.waitForEvent('download');await page.locator('#export-draft').click();const download=await downloadPromise;const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk.toString('utf8');const exported=JSON.parse(text);
    const publicFlags=[];const scan=(o,path='')=>{if(o&&typeof o==='object')for(const [k,v]of Object.entries(o)){if(['verified','approved','passed','verificationStatus','routeEligible'].includes(k))publicFlags.push(path+'.'+k);scan(v,path+'.'+k);}};scan(exported);
    check('Actual downloaded export is valid draft JSON and carries no public authority flags',exported.kind==='local-review-draft'&&exported.records.length===2&&publicFlags.length===0&&exported.records.find(r=>r.candidateId===firstID).evidence.some(e=>e.id===newEvidence.id),{filename:download.suggestedFilename(),publicFlags});
    const beforeInvalid=JSON.stringify(await stored());await upload('{ invalid json');await page.waitForFunction(()=>document.querySelector('#review-feedback').textContent.includes('未导入'));
    check('Malformed import preserves the exact existing stored draft',JSON.stringify(await stored())===beforeInvalid&&(await page.locator('#review-feedback').innerText()).includes('原草稿保留'));
    const forged=JSON.parse(beforeInvalid);forged.records[0].verificationStatus='verified';await upload(forged);await page.waitForFunction(()=>document.querySelector('#review-feedback').textContent.includes('verificationStatus'));
    check('Import refuses a synthetic public-status flag without replacing the draft',JSON.stringify(await stored())===beforeInvalid&&(await page.locator('#review-feedback').innerText()).includes('权威状态'));
    const imported=JSON.parse(beforeInvalid);imported.records[0].notes='合成QA导入备注 · 不是事实核实';await upload(imported);await page.waitForFunction(()=>document.querySelector('#replace-dialog').open);
    check('Valid import opens replacement preview before mutation',JSON.stringify(await stored())===beforeInvalid&&(await page.locator('#replace-title').innerText()).includes('导入'));
    await page.locator('#replace-close').click();check('Cancelling import preview leaves the existing draft',JSON.stringify(await stored())===beforeInvalid);
    await upload(imported);await page.waitForFunction(()=>document.querySelector('#replace-dialog').open);await page.locator('#replace-confirm').click();
    check('Confirming valid import replaces the workbench draft and exposes undo',(await stored()).records[0].notes===imported.records[0].notes&&await page.locator('#undo-replace').isVisible());
    await page.locator('#undo-replace').click();check('Undo restores the exact pre-import draft',JSON.stringify(await stored())===beforeInvalid);
    const catalog=await page.evaluate(async()=>await(await fetch('./data/content-review-catalog.json')).json());
    const complete=JSON.parse(beforeInvalid);
    for(const record of complete.records){
      record.branch={address:'合成QA地址 · 非事实',matchNote:'合成QA身份说明 · 未核实门店'};
      record.entrance={longitude:String((catalog.bounds[0]+catalog.bounds[2])/2),latitude:String((catalog.bounds[1]+catalog.bounds[3])/2),coordinateSystem:'WGS84',level:'合成QA地面描述 · 非实测',matchNote:'合成QA入口说明 · 非事实'};
      record.connection={roadNodeId:String(catalog.roadNodeIds[0]),passageNote:'合成QA通道描述 · 不代表现实通行'};
      record.media.imageUse='none';record.media.videoUse='none';
      for(const [dimension,entry]of Object.entries(record.checks)){entry.conclusion=['image','video'].includes(dimension)?'not-used':'supported';entry.evidenceIds=[record.evidence[0].id];entry.note='合成QA完整字段，仅测试状态计算，不是实际核实材料。';}
    }
    await upload(complete);await page.waitForFunction(()=>document.querySelector('#replace-dialog').open);await page.locator('#replace-confirm').click();
    check('Complete synthetic draft can reach review-ready but public status stays unchanged',await page.locator('#record-state').getAttribute('data-status')==='review-ready'&&(await page.locator('.identity').innerText()).includes('来源候选 · 入口待核 · 未用于到店路线'));
    await page.locator('#undo-replace').click();
    const stale=JSON.parse(JSON.stringify(complete));stale.baseVersion='synthetic-old-base-version';await upload(stale);await page.waitForFunction(()=>document.querySelector('#replace-dialog').open);await page.locator('#replace-confirm').click();
    check('An old base version blocks even an otherwise complete draft and visibly requests recheck',await page.locator('#record-state').getAttribute('data-status')==='incomplete'&&(await page.locator('#base-version').innerText()).includes('旧版草稿')&&(await page.locator('#missing-list').innerText()).includes('旧版基础资料'));
    await page.locator('#undo-replace').click();
    const beforeReset=JSON.stringify(await stored());await page.locator('#reset-open').click();await page.locator('#replace-confirm').click();
    const resetState=await page.evaluate(({key,wants})=>({draft:localStorage.getItem(key),wants:localStorage.getItem(wants),unrelated:localStorage.getItem('content-qa-unrelated')}),{key,wants});
    check('Reset clears only its own workbench key and preserves wants and other keys',resetState.draft===null&&resetState.wants==='["synthetic-want-untouched"]'&&resetState.unrelated==='synthetic-untouched',resetState);
    await page.locator('#undo-replace').click();check('Reset can also be undone before editing',JSON.stringify(await stored())===beforeReset);
    await page.locator('#reset-open').click();await page.locator('#replace-confirm').click();
    report.viewports=[];
    for(const [width,height]of [[320,680],[390,844],[1440,960]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));const m=await metrics();report.viewports.push(m);check('No overall horizontal overflow at '+width,m.scrollWidth===width&&m.outside.length===0,m);
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/content-qa-'+width+'.png',fullPage:false});
      await page.locator('#tab-evidence').click();await page.locator('#add-evidence').click();const evidenceMetrics=await metrics();
      check('Evidence dialog stays inside '+width+' viewport without own horizontal overflow',evidenceMetrics.dialogs.length===1&&evidenceMetrics.dialogs.every(d=>d.left>=0&&d.right<=width&&d.top>=0&&d.bottom<=height&&d.scrollWidth<=d.clientWidth+1),evidenceMetrics.dialogs);
      await page.screenshot({path:'D:/codex/美食网站/output/playwright/content-qa-dialog-'+width+'.png'});await page.locator('#evidence-close').click();
      await page.locator('#audit-open').click();const auditMetrics=await metrics();check('Audit dialog bounds fit '+width+' while table scrolls inside',auditMetrics.dialogs.length===1&&auditMetrics.dialogs.every(d=>d.left>=0&&d.right<=width&&d.top>=0&&d.bottom<=height&&d.scrollWidth<=d.clientWidth+1),auditMetrics.dialogs);await page.locator('#audit-close').click();
      await page.locator('#reset-open').click();const replaceMetrics=await metrics();check('Replacement preview fits '+width,replaceMetrics.dialogs.length===1&&replaceMetrics.dialogs.every(d=>d.left>=0&&d.right<=width&&d.top>=0&&d.bottom<=height&&d.scrollWidth<=d.clientWidth+1),replaceMetrics.dialogs);await page.locator('#replace-close').click();await page.locator('#tab-checks').click();
    }
    check('Browser page emits no runtime errors',report.pageErrors.length===0&&report.consoleErrors.length===0,{pageErrors:report.pageErrors,consoleErrors:report.consoleErrors});
  }catch(e){report.issues.push('Execution error: '+e.message);}
  report.passed=report.issues.length===0;return report;
}
