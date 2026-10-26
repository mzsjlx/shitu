import './content-review.css';
import {DIMENSIONS,CONCLUSIONS,STORAGE_KEY,createDraft,validateDraft,assessRecord,sourceURL} from './content-review-model.js';
import {analyzeDescription,createIntakeMaterial} from './content-intake-model.js';
const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
let catalog,draft,selected,activeTab='checks',pendingReplace=null,undo=null,storageBlocked=false;
let intakeInput=null,intakeSelection=new Set();
const current=()=>draft.records.find(r=>r.candidateId===selected);
const assessment=r=>assessRecord(r,catalog,draft.baseVersion);
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function feedback(text=''){$('review-feedback').textContent=text;$('review-feedback').hidden=!text;}
function savedStatus(saved){$('save-status').textContent=saved?'已保存到当前浏览器 · '+new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}):'尚未保存到浏览器，可先导出备份';}
function changed(){
  draft.updatedAt=new Date().toISOString();undo=null;$('undo-replace').hidden=true;
  if(storageBlocked)savedStatus(false);
  else try{localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));savedStatus(true);}catch{storageBlocked=true;savedStatus(false);feedback('本地保存未成功，填写内容仍在本页，可导出备份。');}
  renderSummary();
}
function getValue(path){return path.split('.').reduce((v,key)=>v[key],current());}
function setValue(path,value){const keys=path.split('.'),last=keys.pop();let target=current();for(const key of keys)target=target[key];target[last]=value;changed();}
function field(label,path,{type='text',options,placeholder,help}={}){
  const wrap=el('label'),title=el('span',label);let input;
  if(options){input=el('select');for(const [value,text]of options){const option=el('option',text);option.value=value;input.append(option);}}
  else if(type==='textarea'){input=el('textarea');input.rows=3;input.maxLength=1500;}
  else{input=el('input');input.type='text';input.maxLength=1500;if(type==='decimal')input.inputMode='decimal';if(type==='numeric')input.inputMode='numeric';}
  input.dataset.path=path;input.id='field-'+path.replaceAll('.','-');input.value=getValue(path);if(placeholder)input.placeholder=placeholder;
  input.addEventListener('input',()=>setValue(path,input.value));wrap.append(title,input);
  if(help){const note=el('small',help,'field-help');wrap.append(note);}return wrap;
}
const help={source:'这里核对来源记录是否可追溯，不能据此确认门店仍在营业。',branch:'记录完整门牌，以及材料如何对应到当前这家分店与地图点；同品牌、同名或重复转载都不够。',entrance:'单独记录有依据的门口坐标和楼层。未知时留空，不把来源POI或最近道路点当门口。',image:'AI图保持示意标识；实拍需要本店对应与用途依据。不用图片也可以明确记录。',video:'原页可读、相关分店、播放可用和允许站内嵌入，分别记录。历史相关外链不要写成该分店已验证实拍。',connection:'只有道路节点编号不证明可以从门口走过去；还要记录通道、楼层/高差和过街依据。'};
function renderChecks(){
  const host=$('check-sections');host.replaceChildren();
  for(const [key,title]of Object.entries(DIMENSIONS)){
    const section=el('details',undefined,'check-section panel');section.dataset.dimension=key;section.open=key==='branch';
    const summary=el('summary');summary.append(el('strong',title),el('small','待核','dimension-caption'));section.append(summary);
    const body=el('div',undefined,'check-body');body.append(el('p',help[key],'dimension-help'));
    body.append(field('草稿结论','checks.'+key+'.conclusion',{options:Object.entries(CONCLUSIONS).filter(([id])=>id!=='not-used'||['image','video'].includes(key))}));
    if(key==='branch')body.append(field('具体门牌地址','branch.address',{placeholder:'只填写有材料支持的地址'}),field('如何对应到此分店 / 来源点','branch.matchNote',{type:'textarea'}));
    if(key==='entrance'){
      const row=el('div',undefined,'coordinate-row');row.append(field('入口经度 · WGS84','entrance.longitude',{type:'decimal',placeholder:'未知则留空'}),field('入口纬度 · WGS84','entrance.latitude',{type:'decimal',placeholder:'未知则留空'}));body.append(row,field('入口楼层 / 地面关系','entrance.level',{placeholder:'例如：材料中确认的楼层及从哪层进入'}),field('门牌、门脸与入口如何对应','entrance.matchNote',{type:'textarea'}));
    }
    if(key==='connection')body.append(field('有来源的道路节点编号','connection.roadNodeId',{type:'numeric',placeholder:'原始OSM node编号'}),field('入口到道路的连接依据','connection.passageNote',{type:'textarea',help:'记录实际通道、楼层/高差、过街与限制；不以吸附距离替代。'}));
    if(key==='image')body.append(field('计划怎样使用图片','media.imageUse',{options:[['illustration','明确标示的AI菜品示意'],['own-photo','自有本店实拍'],['licensed-photo','有用途依据的授权照片'],['none','本轮不使用图片']]}),field('拍摄者 / 权利人（实拍时填写）','media.imageAuthor'),field('本店对应、使用范围及其依据','media.imageScope',{type:'textarea'}));
    if(key==='video')body.append(field('视频使用方式','media.videoUse',{options:[['none','本轮不使用视频'],['outbound-link','跳转原作者页面'],['embed','计划在本站内嵌入']]}),field('内容与分店的对应','media.videoScope',{options:[['related-unmatched','相关内容，分店尚未对应'],['branch-matched','草稿材料认为已对应此分店']]}),field('播放情况','media.playback',{options:[['not-tested','尚未验证播放'],['tested','已记录播放检查材料']]}),field('站内嵌入的检查与使用依据','media.embedNote',{type:'textarea'}));
    const refs=el('fieldset',undefined,'evidence-refs');refs.append(el('legend','引用哪些材料'));
    for(const evidence of current().evidence){const label=el('label'),input=el('input');input.type='checkbox';input.dataset.evidence=evidence.id;input.dataset.dimension=key;input.checked=current().checks[key].evidenceIds.includes(evidence.id);input.addEventListener('change',()=>{const c=current().checks[key];c.evidenceIds=input.checked?[...c.evidenceIds,evidence.id]:c.evidenceIds.filter(id=>id!==evidence.id);changed();});label.append(input,el('span',evidence.title||'未命名材料'));refs.append(label);}
    if(!current().evidence.length)refs.append(el('p','先到材料库添加一份材料，再回来引用。','no-source'));
    body.append(refs,field('这份材料支持什么，还不能确认什么','checks.'+key+'.note',{type:'textarea'}));section.append(body);host.append(section);
  }
  $('general-notes').value=current().notes;
}
function renderCandidates(){
  const list=$('candidate-list');list.replaceChildren();$('candidate-count').textContent=catalog.candidates.length+'家';
  for(const c of catalog.candidates){const button=el('button',undefined,'candidate-button');button.dataset.candidate=c.id;button.setAttribute('aria-pressed',String(c.id===selected));button.append(el('strong',c.name),el('small',assessment(draft.records.find(r=>r.candidateId===c.id)).label));button.addEventListener('click',()=>{selected=c.id;renderRecord();});list.append(button);}
}
function renderEvidence(){
  $('evidence-count').textContent=String(current().evidence.length);const list=$('evidence-list');list.replaceChildren();
  for(const e of current().evidence){const card=el('article',undefined,'evidence-card'),edit=el('button','编辑');edit.setAttribute('aria-label','编辑材料 '+e.title);edit.addEventListener('click',()=>openEvidence(e));card.append(edit,el('h3',e.title||'未命名材料'),el('span','读取 '+(e.observedOn||'未填')+' · 发布 '+(e.publishedOn||'未知'),'evidence-meta'));
    const url=sourceURL(e.url);if(url){const a=el('a','查看原页 ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';card.append(el('br'),a);}if(e.reference)card.append(el('p',e.reference,'local-reference'));if(e.note)card.append(el('p',e.note));list.append(card);
  }
}
function renderSummary(){
  const r=current(),a=assessment(r);$('record-state').textContent=a.label;$('record-state').dataset.status=a.status;
  const rows=$('dimension-state');rows.replaceChildren();
  for(const [key,title]of Object.entries(DIMENSIONS)){
    const complete=a.dimensions[key].complete,row=el('button',undefined,'dimension-row');row.dataset.complete=String(complete);row.dataset.dimension=key;row.append(el('span',title),el('span',complete?'材料已录':'需补充'));
    row.addEventListener('click',()=>{setTab('checks');const section=document.querySelector('details[data-dimension="'+key+'"]');section.open=true;section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});rows.append(row);
    const section=document.querySelector('details[data-dimension="'+key+'"] .dimension-caption');if(section)section.textContent=complete?'材料已录':r.checks[key].conclusion==='conflicting'?'存在冲突':'待补';
  }
  const missing=$('missing-list');missing.replaceChildren();for(const note of a.missing.length?a.missing:['所用资料字段已齐，可导出交由复核；公众门店状态保持不变。'])missing.append(el('li',note));
  $('base-version').textContent=(a.stale?'旧版草稿，需重新对照当前资料。':'基础资料版本：'+catalog.baseVersion.slice(0,12))+' · 公众地图未变更';
  for(const button of $('candidate-list').querySelectorAll('button')){const record=draft.records.find(r=>r.candidateId===button.dataset.candidate);button.querySelector('small').textContent=assessment(record).label;}
  $('preview-title').textContent=a.label;const preview=$('preview-summary');preview.replaceChildren();
  for(const [key,label]of Object.entries(DIMENSIONS)){const row=el('div',undefined,'preview-row');row.append(el('strong',label+' · '+CONCLUSIONS[r.checks[key].conclusion]),el('p',r.checks[key].note||'尚未填写判断依据。'));preview.append(row);} $('draft-json').textContent=JSON.stringify(r,null,2);
}
function setTab(tab){activeTab=tab;for(const id of ['checks','evidence','preview']){$(id+'-view').hidden=id!==tab;$('tab-'+id).setAttribute('aria-selected',String(id===tab));}}
function renderRecord(){
  const c=catalog.candidates.find(c=>c.id===selected);$('candidate-title').textContent=c.name;$('candidate-category').textContent=c.category+' · 待核候选';$('candidate-origin').textContent='原记录名：'+c.sourceName+' · 缓存日期 '+c.sourceDate;
  $('candidate-coordinates').textContent=c.coordinates.join(', ')+' · '+c.coordinateSystem+'（来源地点，不等于门口）';$('candidate-source').href=c.sourceURL;
  renderCandidates();renderChecks();renderEvidence();renderSummary();setTab(activeTab);
}
function openEvidence(e){
  $('evidence-form').reset();$('evidence-error').hidden=true;$('evidence-dialog-title').textContent=e?'编辑这份材料':'添加一份材料';
  const initial=e||{id:'',kind:'other',title:'',url:'',reference:'',observedOn:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),publishedOn:'',note:''};
  for(const [key,id]of Object.entries({id:'id',kind:'kind',title:'title',url:'url',reference:'reference',observedOn:'observed',publishedOn:'published',note:'note'}))$('evidence-'+id).value=initial[key];
  $('evidence-dialog').showModal();
}
function intakeError(message=''){$('intake-error').textContent=message;$('intake-error').hidden=!message;if(message)$('intake-error').scrollIntoView({block:'nearest',behavior:'instant'});}
function clearIntakePreview(){intakeInput=null;intakeSelection.clear();$('intake-preview').hidden=true;$('intake-save').disabled=true;intakeError();}
function readIntake(){return {title:$('intake-title-input').value.trim(),url:$('intake-url').value.trim(),author:$('intake-author').value.trim(),observedOn:$('intake-observed').value,publishedOn:$('intake-published').value,text:$('intake-text').value};}
function openIntake(){
  $('intake-form').reset();clearIntakePreview();
  $('intake-observed').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
  const choices=$('intake-candidate');choices.replaceChildren();
  for(const c of catalog.candidates){const option=el('option',c.name);option.value=c.id;choices.append(option);}choices.value=selected;
  $('intake-dialog').showModal();
}
function previewIntake(event){
  event.preventDefault();clearIntakePreview();
  try{
    const input=readIntake(),lines=analyzeDescription(input.text,catalog);
    // Validate metadata with a selected clue before presenting a save action.
    if(lines.length)createIntakeMaterial(input,[lines[0].id],$('intake-candidate').value,catalog,'material-preview');
    else{
      if(!input.title||!sourceURL(input.url)||!input.observedOn)throw new Error('请填写标题、有效的HTTPS原页链接和读取日期。');
    }
    intakeInput=input;const host=$('intake-lines');host.replaceChildren();
    for(const line of lines){
      const row=el('li'),label=el('label'),checkbox=el('input');checkbox.type='checkbox';checkbox.value=line.id;
      checkbox.addEventListener('change',()=>{checkbox.checked?intakeSelection.add(line.id):intakeSelection.delete(line.id);$('intake-save').disabled=!intakeSelection.size;});
      const copy=el('span'),tags=line.kinds.map(kind=>({address:'地址文字',timecode:'时间点',name:'已有名称文字'}[kind])).join(' · ');
      copy.append(el('small','第'+line.lineNumber+'行 · '+tags),el('span',line.text));label.append(checkbox,copy);row.append(label);host.append(row);
    }
    $('intake-summary').textContent=lines.length?'找到 '+lines.length+' 行文字线索，请勾选要保留的内容。':'没有识别到地址、时间点或已有门店名称。可返回补充原文，或使用“添加材料”手动记录。';
    $('intake-preview').hidden=false;
  }catch(error){intakeError(error.message);}
}
function saveIntake(){
  try{
    if(!intakeInput)throw new Error('请先预览当前文字。');
    const material=createIntakeMaterial(intakeInput,[...intakeSelection],$('intake-candidate').value,catalog,'material-'+crypto.randomUUID());
    const copy=clone(draft),record=copy.records.find(r=>r.candidateId===material.candidateId);
    if(record.evidence.some(e=>sourceURL(e.url)===material.evidence.url&&e.note===material.evidence.note))throw new Error('这份原页与相同线索已在材料库中，无需重复添加。');
    record.evidence.push(material.evidence);validateDraft(copy,catalog);draft=copy;selected=material.candidateId;activeTab='evidence';changed();renderRecord();$('intake-dialog').close();
    feedback('已整理为一份材料，尚未改动六项核实结论。请阅读原页并在核实项目中选择引用。');$('add-evidence').focus({preventScroll:true});
  }catch(error){intakeError(error.message);}
}
function normalize(value){const base=createDraft(catalog);return {...value,records:catalog.candidates.map(c=>value.records.find(r=>r.candidateId===c.id)||base.records.find(r=>r.candidateId===c.id))};}
function askReplace(value,reset=false){pendingReplace={value,reset};$('replace-title').textContent=reset?'恢复初始工作台资料？':'导入这份草稿？';$('replace-summary').textContent=reset?'将清除当前浏览器的工作台草稿，恢复两家候选的初始材料。':'已检查文件结构。将替换 '+value.records.length+' 条草稿；未包含的候选恢复初始材料。'+(value.baseVersion!==catalog.baseVersion?'文件基于旧版资料，会保留待补状态。':'基础资料版本一致。');$('replace-confirm').textContent=reset?'恢复初始资料':'替换工作台草稿';$('replace-dialog').showModal();}
function renderAudit(){
  const a=catalog.audit,c=a.counts;$('audit-summary').textContent=c.foodObjects+'条餐饮线索 · '+c.explicitEntranceNodes+'个入口点 · '+c.completeFoodEntranceCandidates+'个明确对应';
  $('audit-details').textContent='缓存中有'+c.foodObjects+'个餐饮相关地点、'+c.explicitEntranceNodes+'个明确入口。'+c.explicitEntranceNodesInAcceptedRoadGraph+'个入口在当前道路图上，但没有材料将它们对应到餐饮分店。当前可直接接入到店路线的完整候选为'+c.completeFoodEntranceCandidates+'个。';
  const body=$('audit-foods');body.replaceChildren();for(const f of a.foods){const row=el('tr'),name=el('td'),url=sourceURL(f.sourceURL);if(url){const link=el('a',f.name||'未命名来源点');link.href=url;link.target='_blank';link.rel='noopener noreferrer';name.append(link);}else name.textContent=f.name||'未命名来源点';row.append(name,el('td',f.address||'未记录'),el('td',f.level||'未记录'),el('td',f.entranceMatched?'有源对应':'未建立'));body.append(row);}
}
function wire(){
  for(const id of ['checks','evidence','preview'])$('tab-'+id).addEventListener('click',()=>setTab(id));
  $('general-notes').addEventListener('input',()=>{current().notes=$('general-notes').value;changed();});
  $('add-evidence').addEventListener('click',()=>openEvidence());$('evidence-close').addEventListener('click',()=>$('evidence-dialog').close());
  $('intake-open').addEventListener('click',openIntake);$('intake-close').addEventListener('click',()=>$('intake-dialog').close());
  $('intake-form').addEventListener('submit',previewIntake);$('intake-save').addEventListener('click',saveIntake);
  for(const id of ['intake-title-input','intake-url','intake-author','intake-observed','intake-published','intake-text'])$(id).addEventListener('input',clearIntakePreview);
  $('evidence-form').addEventListener('submit',event=>{
    event.preventDefault();const e={id:$('evidence-id').value||'material-'+crypto.randomUUID(),kind:$('evidence-kind').value,title:$('evidence-title').value.trim(),url:$('evidence-url').value.trim(),reference:$('evidence-reference').value.trim(),observedOn:$('evidence-observed').value,publishedOn:$('evidence-published').value,note:$('evidence-note').value};
    try{if(!e.title||(!e.url&&!e.reference)||!e.observedOn)throw new Error('请填写材料标题、来源位置和读取日期。');const copy=clone(draft),r=copy.records.find(r=>r.candidateId===selected),index=r.evidence.findIndex(v=>v.id===e.id);if(index<0)r.evidence.push(e);else r.evidence[index]=e;validateDraft(copy,catalog);draft=copy;changed();renderRecord();$('evidence-dialog').close();}catch(error){$('evidence-error').textContent=error.message;$('evidence-error').hidden=false;}
  });
  $('export-draft').addEventListener('click',()=>{try{const payload=validateDraft(draft,catalog),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'})),link=el('a');link.href=url;link.download='foodcity-content-draft-'+payload.updatedAt.slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('已导出当前填写内容；文件包含草稿说明，不包含地图收藏或公众状态变更。');}catch(e){feedback('暂不能导出：'+e.message);}});
  $('import-open').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async()=>{const file=$('import-file').files[0];$('import-file').value='';if(!file)return;try{if(file.size>512*1024)throw new Error('文件超过512 KiB。');const value=validateDraft(JSON.parse(await file.text()),catalog);if(!value.records.length)throw new Error('文件中没有草稿记录。');askReplace(value);}catch(e){feedback('未导入，原草稿保留：'+e.message);}});
  $('reset-open').addEventListener('click',()=>askReplace(createDraft(catalog),true));$('replace-close').addEventListener('click',()=>$('replace-dialog').close());
  $('replace-confirm').addEventListener('click',()=>{
    if(!pendingReplace)return;const before=clone(draft),next=normalize(pendingReplace.value);
    try{if(pendingReplace.reset)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,JSON.stringify(next));draft=next;storageBlocked=false;undo=before;$('undo-replace').hidden=false;renderRecord();savedStatus(!pendingReplace.reset);feedback(pendingReplace.reset?'已恢复初始资料，可以撤销。':'草稿已替换，可以撤销；公众地图保持不变。');$('replace-dialog').close();pendingReplace=null;}catch(e){feedback('未替换，原草稿保留：本地存储未成功。');}
  });
  $('undo-replace').addEventListener('click',()=>{if(!undo)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(undo));draft=undo;undo=null;$('undo-replace').hidden=true;storageBlocked=false;renderRecord();savedStatus(true);feedback('已恢复替换前的工作台草稿。');}catch{feedback('未能恢复到本地存储，当前草稿保留。');}});
  $('audit-open').addEventListener('click',()=>$('audit-dialog').showModal());$('audit-close').addEventListener('click',()=>$('audit-dialog').close());
}
async function init(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch('./data/content-review-catalog.json',{signal:controller.signal});if(!response.ok)throw new Error('候选资料读取失败');catalog=await response.json();if(catalog.schemaVersion!==1||!catalog.candidates?.length)throw new Error('候选资料格式不完整');}finally{clearTimeout(timer);}
  draft=createDraft(catalog);validateDraft(draft,catalog);selected=catalog.candidates[0].id;
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){draft=normalize(validateDraft(JSON.parse(raw),catalog));savedStatus(true);}else $('save-status').textContent='初始材料已载入，填写后自动保存到当前浏览器';}catch{storageBlocked=true;savedStatus(false);feedback('上次草稿或本地存储暂不可读取。当前显示初始材料；填写内容可导出备份，重置工作台后可重新尝试保存。');}
  wire();renderRecord();renderAudit();$('workbench').hidden=false;$('review-loading').hidden=true;for(const id of ['import-open','export-draft','reset-open'])$(id).disabled=false;window.__CONTENT_REVIEW_BOOT__.ready();
}
init().catch(e=>{$('review-load-state').textContent='工作台暂未准备好：'+e.message;$('save-status').textContent='资料未载入，尚未改动任何草稿';});
