export const DIMENSIONS={source:'地点来源',branch:'具体分店',entrance:'门店入口',image:'图片用途',video:'视频用途',connection:'入口到道路'};
export const CONCLUSIONS={unreviewed:'未检查','needs-evidence':'待补材料',supported:'草稿认为有依据',conflicting:'发现矛盾','not-used':'本轮不使用'};
export const STORAGE_KEY='foodcity:content-review:chongqing:v1';
const kinds=['map-record','creator-page','photo-rights','onsite-note','project-asset','other'];
const imageUses=['illustration','own-photo','licensed-photo','none'],videoUses=['none','outbound-link','embed'];
const fail=(path,message)=>{throw new Error(path+'：'+message);};
function object(value,keys,path){if(!value||typeof value!=='object'||Array.isArray(value))fail(path,'需要对象');for(const key of Object.keys(value))if(!keys.includes(key))fail(path+'.'+key,'不接受这个字段');}
function string(value,path,max=1500){if(typeof value!=='string'||value.length>max)fail(path,'需要不超过'+max+'字的文本');return value;}
function choice(value,values,path){if(!values.includes(value))fail(path,'不是支持的选项');}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function sourceURL(value){if(!value)return null;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function scanKeys(value,path='草稿'){if(value&&typeof value==='object')for(const key of Object.keys(value)){if(['__proto__','constructor','prototype','verificationStatus','routeEligible','verified','approved','passed'].includes(key))fail(path+'.'+key,'草稿不能携带权威状态或异常键');scanKeys(value[key],path+'.'+key);}}
export function validateDraft(value,catalog){
  scanKeys(value);object(value,['schemaVersion','kind','city','baseVersion','updatedAt','records'],'草稿');
  if(value.schemaVersion!==1||value.kind!=='local-review-draft'||value.city!=='chongqing')fail('草稿','版本或类型不匹配');
  string(value.baseVersion,'baseVersion',100);string(value.updatedAt,'updatedAt',40);
  if(!value.baseVersion.trim())fail('baseVersion','不能留空');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.updatedAt)||!Number.isFinite(new Date(value.updatedAt).getTime())||new Date(value.updatedAt).toISOString()!==value.updatedAt)fail('updatedAt','需要有效的标准UTC日期时间');
  if(!Array.isArray(value.records)||value.records.length>100)fail('records','最多100条草稿');
  const candidates=new Set(catalog.candidates.map(c=>c.id)),ids=new Set();
  for(const [i,r]of value.records.entries()){
    const p='records['+i+']';object(r,['candidateId','evidence','checks','branch','entrance','connection','media','notes'],p);
    if(!candidates.has(r.candidateId)||ids.has(r.candidateId))fail(p+'.candidateId','不是当前候选或重复');ids.add(r.candidateId);
    string(r.notes,p+'.notes',3000);
    if(!Array.isArray(r.evidence)||r.evidence.length>50)fail(p+'.evidence','最多50份材料');
    const refs=new Set();
    for(const [j,e]of r.evidence.entries()){
      const ep=p+'.evidence['+j+']';object(e,['id','kind','title','url','reference','observedOn','publishedOn','note'],ep);
      string(e.id,ep+'.id',80);if(!e.id||refs.has(e.id))fail(ep+'.id','为空或重复');refs.add(e.id);
      choice(e.kind,kinds,ep+'.kind');string(e.title,ep+'.title',180);string(e.url,ep+'.url',2000);string(e.reference,ep+'.reference',500);string(e.note,ep+'.note',2000);
      if(e.url&&!sourceURL(e.url))fail(ep+'.url','只接受不带用户名密码的HTTPS原页');
      for(const key of ['observedOn','publishedOn']){string(e[key],ep+'.'+key,10);if(e[key]&&!validDate(e[key]))fail(ep+'.'+key,'需要有效的年月日');}
    }
    object(r.checks,Object.keys(DIMENSIONS),p+'.checks');
    for(const key of Object.keys(DIMENSIONS)){
      const c=r.checks[key],cp=p+'.checks.'+key;object(c,['conclusion','evidenceIds','note'],cp);choice(c.conclusion,Object.keys(CONCLUSIONS),cp+'.conclusion');
      if(c.conclusion==='not-used'&&!['image','video'].includes(key))fail(cp,'该项不能跳过');
      if(!Array.isArray(c.evidenceIds)||new Set(c.evidenceIds).size!==c.evidenceIds.length||c.evidenceIds.some(id=>!refs.has(id)))fail(cp+'.evidenceIds','材料引用不存在或重复');
      string(c.note,cp+'.note',2000);
    }
    const sections={branch:['address','matchNote'],entrance:['longitude','latitude','coordinateSystem','level','matchNote'],connection:['roadNodeId','passageNote'],media:['imageUse','videoUse','imageAuthor','imageScope','videoScope','playback','embedNote']};
    for(const [key,keys]of Object.entries(sections)){object(r[key],keys,p+'.'+key);for(const field of keys)string(r[key][field],p+'.'+key+'.'+field,1500);}
    if(r.entrance.coordinateSystem!=='WGS84')fail(p+'.entrance.coordinateSystem','当前只记录WGS84入口资料');
    choice(r.media.imageUse,imageUses,p+'.media.imageUse');choice(r.media.videoUse,videoUses,p+'.media.videoUse');choice(r.media.videoScope,['related-unmatched','branch-matched'],p+'.media.videoScope');choice(r.media.playback,['not-tested','tested'],p+'.media.playback');
  }
  // Copy only validated JSON values; derived review outcomes are never imported.
  return JSON.parse(JSON.stringify(value));
}
export function createDraft(catalog,now=new Date().toISOString()){
  return {schemaVersion:1,kind:'local-review-draft',city:'chongqing',baseVersion:catalog.baseVersion,updatedAt:now,records:catalog.candidates.map(c=>JSON.parse(JSON.stringify(c.seed)))};
}
export function assessRecord(record,catalog,baseVersion){
  const missing=[],dimensions={},stale=baseVersion!==catalog.baseVersion;let conflict=false;
  if(stale)missing.push('草稿使用旧版基础资料，请重新对照来源。');
  for(const [key,label]of Object.entries(DIMENSIONS)){
    const c=record.checks[key],reasons=[];
    if(c.conclusion==='conflicting'){conflict=true;reasons.push('已记录相互矛盾的材料。');}
    else if(c.conclusion==='not-used'){
      const use=record.media[key==='image'?'imageUse':'videoUse'];if(use!=='none')reasons.push('用途仍在使用，不能跳过核对。');
    }else if(c.conclusion!=='supported')reasons.push('尚未记录有依据的草稿判断。');
    if(!['not-used','unreviewed','needs-evidence'].includes(c.conclusion)){
      const evidence=c.evidenceIds.map(id=>record.evidence.find(e=>e.id===id));
      if(!evidence.length)reasons.push('需要引用材料。');
      if(evidence.some(e=>!e||!e.title.trim()||!e.observedOn||(!e.url&&!e.reference)))reasons.push('所引材料缺少标题、读取日期或来源。');
      if(!c.note.trim())reasons.push('需要写明这份材料支持什么。');
    }
    if(c.conclusion==='supported'){
      if(key==='branch'&&(!record.branch.address.trim()||!record.branch.matchNote.trim()))reasons.push('补齐具体地址，以及如何对应这家分店/地图点。');
      if(key==='entrance'){
        const e=record.entrance,lon=e.longitude.trim()?Number(e.longitude):NaN,lat=e.latitude.trim()?Number(e.latitude):NaN,b=catalog.bounds;
        if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<b[0]||lon>b[2]||lat<b[1]||lat>b[3])reasons.push('需要当前城区范围内、有来源的独立WGS84入口点。');
        if(!e.level.trim()||!e.matchNote.trim())reasons.push('补齐入口楼层/地面关系及门脸对应说明。');
      }
      if(key==='connection'){
        const id=record.connection.roadNodeId;
        if(!/^\d+$/.test(id)||!catalog.roadNodeIds.includes(Number(id)))reasons.push('道路节点不在当前试算图中，需补资料或扩展覆盖。');
        if(!record.connection.passageNote.trim())reasons.push('需要入口到道路的通行、楼层/高差与过街依据。');
      }
      if(key==='image'){
        if(record.media.imageUse==='none')reasons.push('不用图片时，请将本项设为“本轮不使用”。');
        if(['own-photo','licensed-photo'].includes(record.media.imageUse)&&(!record.media.imageAuthor.trim()||!record.media.imageScope.trim()))reasons.push('补齐拍摄者/权利人、本店对应与可用范围依据。');
      }
      if(key==='video'){
        if(record.media.videoUse==='none')reasons.push('不用视频时，请将本项设为“本轮不使用”。');
        if(record.media.videoUse==='embed'&&(record.media.videoScope!=='branch-matched'||record.media.playback!=='tested'||!record.media.embedNote.trim()))reasons.push('站内嵌入需分别记录分店对应、播放及嵌入使用依据。');
      }
    }
    dimensions[key]={complete:reasons.length===0,reasons};for(const reason of reasons)missing.push(label+'：'+reason);
  }
  return {status:conflict?'conflict':missing.length?'incomplete':'review-ready',label:conflict?'存在冲突':missing.length?'资料待补':'可提交复核',stale,missing,dimensions,completed:Object.values(dimensions).filter(d=>d.complete).length};
}
