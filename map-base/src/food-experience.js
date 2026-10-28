import {validateVideoLibrary,localVideoAsset} from './video-library-model.js';
import {FoodRoutePreview,directDistanceText} from './food-route-preview.js';
import bundledVideoLibrary from '../data/video-library.json';
const byId=id=>document.getElementById(id);
const allowedURL=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}};
const thumbFor=(item,cls)=>{
  const thumb=document.createElement('span');thumb.className=cls;
  if(item.photoURL){thumb.style.backgroundImage='url('+JSON.stringify(item.photoURL)+')';thumb.style.backgroundSize='cover';thumb.style.backgroundPosition='center';thumb.setAttribute('aria-label',item.name+' · 原视频画面');}
  else{thumb.classList.add('food-sprite');thumb.style.backgroundImage='url('+JSON.stringify(item.spriteURL)+')';thumb.style.backgroundPositionX=(item.spriteIndex*50)+'%';thumb.setAttribute('aria-label','AI菜品示意，非门店实拍');const note=document.createElement('small');note.textContent='示意';thumb.append(note);}
  thumb.setAttribute('role','img');return thumb;
};
export class FoodExperience{
  constructor(map,overlay,{config,readJSON,assetURL,onFocus,onExplore=onFocus}){
    this.map=map;this.overlay=overlay;this.config=config;this.readJSON=readJSON;this.assetURL=assetURL;this.onFocus=onFocus;this.onExplore=onExplore;
    this.records=[];this.phase='unloaded';this.active=false;this.selected=null;this.generation=0;this.saved=[];this.category=null;this.draftCategory=null;this.routeSuppressed=false;
    this.routePreview=new FoodRoutePreview(map,overlay.Marker);
    const query=new URLSearchParams(location.search),place=query.get('place');
    this.initialPlaceId=(!query.get('view')||query.get('view')==='food')&&place&&place.length<=100?place:null;
    byId('place-directory-link').hidden=!['http:','https:'].includes(location.protocol);
    for(const id of ['creator-guides-link','food-pick-guides'])byId(id).hidden=!['http:','https:'].includes(location.protocol);
    try{const saved=JSON.parse(localStorage.getItem('foodcity:wants:chongqing:v1')||'[]');if(Array.isArray(saved))this.saved=[...new Set(saved.filter(x=>typeof x==='string'&&x.length<=100))].slice(0,100);}catch{}
    byId('food-entry').addEventListener('click',()=>this.active?this.deactivate():this.activate());
    byId('food-option').addEventListener('change',event=>event.target.checked?this.activate():this.deactivate());
    for(const id of ['wants-open','trip-open','trip-manage'])byId(id).addEventListener('click',event=>this.openWants(event.currentTarget));
    byId('trip-overview').addEventListener('click',()=>this.focusStops());
    byId('trip-map-all').addEventListener('click',()=>{byId('wants-dialog').close();this.focusStops();});
    byId('food-pick-open').addEventListener('click',()=>this.openPicker());
    byId('food-pick-close').addEventListener('click',()=>byId('food-pick-dialog').close());
    byId('food-pick-map').addEventListener('click',()=>this.applyPicker(false));
    byId('food-pick-add').addEventListener('click',()=>this.applyPicker(true));
    byId('food-pick-dialog').addEventListener('close',()=>{
      if(byId('food-dialog').open||byId('wants-dialog').open)return;
      (this.active?byId('food-pick-open'):byId('food-entry')).focus({preventScroll:true});
    });
    byId('food-close').addEventListener('click',()=>byId('food-dialog').close());
    byId('wants-close').addEventListener('click',()=>byId('wants-dialog').close());
    byId('food-dialog').addEventListener('close',()=>{
      if(byId('food-pick-dialog').open){
        const result=[...byId('food-pick-results').querySelectorAll('button')].find(button=>button.dataset.pickId===this.selected?.id);
        (result||byId('food-pick-close')).focus({preventScroll:true});return;
      }
      if(byId('wants-dialog').open){
        const row=[...byId('wants-list').children].find(row=>row.dataset.savedId===this.selected?.id);
        (row?.querySelector('.want-item')||byId('wants-close')).focus({preventScroll:true});return;
      }
      const card=this.overlay.items.find(entry=>entry.item.id===this.selected?.id)?.button;
      (card?.getClientRects().length&&getComputedStyle(card).visibility!=='hidden'?card:byId('food-entry')).focus({preventScroll:true});
    });
    byId('wants-dialog').addEventListener('close',()=>{
      if(byId('food-dialog').open)return;
      const target=this.wantsOpener?.getClientRects().length?this.wantsOpener:(!byId('wants-open').hidden?byId('wants-open'):byId('food-entry'));
      target.focus({preventScroll:true});
    });
    byId('food-save').addEventListener('click',()=>{if(this.selected)this.toggleSave(this.selected.id);});
    map.on('movestart',event=>{if(event.originalEvent)this.cancelFocus();});
    this.dockObserver=new ResizeObserver(()=>this.overlay.scheduleLayout());this.dockObserver.observe(byId('trip-dock'));
  }
  cancelFocus(){this.generation++;this.initialPlaceId=null;}
  async load(){
    if(this.phase==='loaded')return;
    if(this.pending)return this.pending;
    this.phase='loading';this.error=null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new Error('美食资料读取超时')),12000);
    this.pending=Promise.all([this.readJSON(this.config.records,{signal:controller.signal}),this.readJSON('data/video-library.json',{signal:controller.signal}).catch(()=>bundledVideoLibrary)]).then(async([data,catalog])=>{
      if(data.city!=='chongqing'||!Array.isArray(data.records)||data.records.length<1)throw new Error('美食资料尚未准备好');
      const records=data.records.map(item=>({...item,spriteURL:this.assetURL(this.config.sprite)}));
      validateVideoLibrary(catalog);
      const b=this.overlay.bounds,positioned=catalog.sources.flatMap(source=>source.segments.map(segment=>({source,segment}))).filter(({segment})=>Array.isArray(segment.coordinates)&&segment.coordinates[0]>=b[0]&&segment.coordinates[0]<=b[2]&&segment.coordinates[1]>=b[1]&&segment.coordinates[1]<=b[3]);
      let assets={};if(positioned.length){try{assets=(await this.readJSON('data/video-library-assets.json',{signal:controller.signal})).segments||{};}catch{}}
      for(const {source,segment}of positioned){
        const asset=assets[segment.id],clip=localVideoAsset(asset?.clip,'mp4'),poster=localVideoAsset(asset?.poster,'jpg');
        records.push({id:'video-'+segment.id,name:segment.name,category:segment.category,coordinates:segment.coordinates,coordinateSystem:'WGS84',verificationStatus:'video-location',coordinateEvidence:{kind:'video-coordinate',url:source.url},entranceStatus:'unverified',routeEligible:false,address:segment.addressText||'原片未提供详细地址',summary:segment.summary,spriteURL:this.assetURL(this.config.sprite),spriteIndex:0,photoURL:clip&&poster?poster:null,localClip:clip&&poster?clip:null,localPoster:clip&&poster?poster:null,clipAuthor:source.author,originalVideoURL:source.url,videos:[{title:source.title,author:source.author,url:source.url}]});
      }
      this.overlay.validate(records,true);
      this.records=records;this.phase='loaded';this.saved=this.saved.filter(id=>records.some(record=>record.id===id));this.refreshSaved();
    }).catch(error=>{this.phase='error';this.error=error.message;byId('food-load-note').textContent='美食资料暂未展开，点击“美食探索”重试。';byId('food-load-note').hidden=false;}).finally(()=>{clearTimeout(timer);this.pending=null;});
    return this.pending;
  }
  async activate(){
    const generation=++this.generation,requestedPlaceId=this.initialPlaceId;this.onFocus();
    byId('food-entry').setAttribute('aria-busy','true');
    await this.load();byId('food-entry').removeAttribute('aria-busy');
    if(generation!==this.generation||this.phase!=='loaded')return;
    this.initialPlaceId=null;
    this.active=true;byId('food-option').checked=true;byId('food-entry').setAttribute('aria-pressed','true');document.body.classList.add('food-active');
    byId('wants-open').hidden=false;byId('food-load-note').hidden=true;document.querySelector('.map-shell').classList.add('food-mode');
    if(requestedPlaceId)this.category=null;
    this.renderCandidates();
    this.renderDock();
    this.map.resize();
    const requested=this.records.find(item=>item.id===requestedPlaceId);
    if(requested){this.focusStops(requested.id);this.open(requested);return;}
    if(requestedPlaceId)byId('status').textContent='这个地点暂不在当前资料中，已展开现有美食候选。';
    const points=this.visibleRecords().map(r=>r.coordinates),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const padding=this.fitPadding();
    this.map.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding,maxZoom:16.3,pitch:48,bearing:-24,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1050});
  }
  deactivate(){
    this.cancelFocus();this.active=false;this.overlay.clear();byId('food-option').checked=false;document.body.classList.remove('food-active');
    if(byId('food-pick-dialog').open)byId('food-pick-dialog').close();
    byId('food-entry').setAttribute('aria-pressed','false');byId('wants-open').hidden=true;
    document.querySelector('.map-shell').classList.remove('food-mode');
    this.renderDock();
  }
  visibleRecords(category=this.category){return category===null?this.records:this.records.filter(item=>item.category===category);}
  renderCandidates(){
    const records=this.visibleRecords();
    this.overlay.replaceCandidates(records,item=>this.openMapCard(item),{onToggleSave:item=>this.toggleSave(item.id)});
    this.overlay.setState(this.selected?.id,this.saved);
    byId('food-pick-label').textContent=this.category===null?'今天想吃什么':this.category+' · '+records.length+'家';
    byId('food-pick-open').setAttribute('aria-label',this.category===null?'挑选想吃的美食类别':'当前只看'+this.category+'，'+records.length+'家；更换类别或查看全部');
  }
  openPicker(){
    if(!this.active||this.phase!=='loaded')return;
    this.overlay.popover.close();
    this.draftCategory=this.category;
    const categories=byId('food-pick-categories');categories.replaceChildren();
    for(const category of [null,...new Set(this.records.map(item=>item.category).filter(Boolean))]){
      const label=document.createElement('label');label.className='food-pick-choice';
      const input=document.createElement('input');input.type='radio';input.name='food-category';input.value=category===null?'':category;input.checked=category===this.draftCategory;
      input.addEventListener('change',()=>{this.draftCategory=category;this.renderPickerResults();});
      const name=document.createElement('span');name.textContent=category===null?'都看看':category;
      const count=document.createElement('small');count.textContent=String(this.visibleRecords(category).length);
      label.append(input,name,count);categories.append(label);
    }
    this.renderPickerResults();
    if(!byId('food-pick-dialog').open)byId('food-pick-dialog').showModal();
  }
  renderPickerResults(){
    const records=this.visibleRecords(this.draftCategory),list=byId('food-pick-results');list.replaceChildren();
    byId('food-pick-count').textContent=records.length+' 家美食候选';
    for(const item of records){
      const row=document.createElement('li'),button=document.createElement('button');button.className='food-pick-result';button.type='button';button.dataset.pickId=item.id;
      button.setAttribute('aria-label','查看'+item.name+'详情');
      const thumb=thumbFor(item,'food-pick-thumb');
      const copy=document.createElement('span');copy.className='food-pick-copy';
      const title=document.createElement('strong');title.textContent=item.name;
      const state=document.createElement('small');state.textContent=item.category+' · '+(this.saved.includes(item.id)?'已加入想去':'候选地点');copy.append(title,state);
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(thumb,copy,arrow);
      button.addEventListener('click',()=>this.open(item));row.append(button);list.append(row);
    }
    const remaining=records.filter(item=>!this.saved.includes(item.id)).length;
    byId('food-pick-add').textContent=remaining?'加入想去 · '+remaining+'家':'查看想去顺序';
    byId('food-pick-map').disabled=records.length===0;byId('food-pick-add').disabled=records.length===0;
  }
  applyPicker(add){
    if(!this.active||this.phase!=='loaded'||!byId('food-pick-dialog').open)return;
    const records=this.visibleRecords(this.draftCategory);if(!records.length)return;
    this.category=this.draftCategory;this.selected=null;this.renderCandidates();this.renderDock();
    if(add){
      const additions=records.map(item=>item.id).filter(id=>!this.saved.includes(id));
      if(additions.length){this.saved.push(...additions);this.persistSaved();}
      this.refreshSaved();byId('food-pick-dialog').close();this.openWants(byId('food-pick-open'));
      byId('status').textContent=additions.length?'已把 '+additions.length+' 家候选加到想去末尾，可继续调整顺序':'已保留原来的想去顺序';
    }else{
      byId('food-pick-dialog').close();this.frameRecords(records);
      byId('status').textContent='已在地图上展示 '+records.length+' 家'+(this.category||'美食')+'候选';
    }
  }
  openMapCard(item){
    this.selected=item;
    if(!this.saved.includes(item.id)){this.saved.push(item.id);this.persistSaved();}
    this.refreshSaved();this.overlay.showPopover(item,true);
    byId('status').textContent=item.name+'已加入想去，选两家可查看直线距离。';
  }
  open(item){
    this.overlay.popover.close();
    this.selected=item;this.overlay.setState(item.id,this.saved);
    const pageLink=byId('food-page-link');pageLink.hidden=item.verificationStatus==='video-location'||!['http:','https:'].includes(location.protocol);
    if(!pageLink.hidden)pageLink.href=new URL('./places/'+encodeURIComponent(item.id)+'.html',location.href).href;
    byId('food-title').textContent=item.name;byId('food-category').textContent=item.category;
    byId('food-address').textContent=item.address||'公开地图记录尚未提供完整门牌。';
    byId('food-intro').textContent=item.summary;
    const hero=byId('food-hero');hero.style.backgroundImage='url('+JSON.stringify(item.photoURL||item.spriteURL)+')';hero.style.backgroundSize=item.photoURL?'cover':'';hero.style.backgroundPosition=item.photoURL?'center':(item.spriteIndex*50)+'% center';hero.setAttribute('aria-label',item.photoURL?item.name+' · 原视频画面':'AI生成的通用菜品示意，非门店实拍');hero.querySelector('.photo-note').textContent=item.photoURL?'原视频画面':'菜品示意 · 非门店实拍';
    byId('food-location-note').textContent=item.verificationStatus==='video-location'?'视频门店位置已录入，分店及入口仍需核对。':'地图位置来自 '+item.coordinateEvidence.sourceDate+' 的开放地图节点，当前店址、营业及入口仍待核实。';
    const sources=byId('food-sources');sources.replaceChildren();
    for(const source of [{label:item.verificationStatus==='video-location'?'查看原视频':'查看原始地图记录',url:item.coordinateEvidence.url},...(item.sources||[])]){
      const url=allowedURL(source.url);if(!url)continue;
      const link=document.createElement('a');link.textContent=source.label;link.href=url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);
    }
    const videos=byId('food-videos');videos.replaceChildren();
    for(const video of item.videos||[]){
      const url=allowedURL(video.url);if(!url)continue;
      const link=document.createElement('a');link.className='video-source';link.href=url;link.target='_blank';link.rel='noopener noreferrer';
      const title=document.createElement('strong');title.textContent=video.title;
      const note=document.createElement('small');note.textContent=video.author+(video.publishedOn?' · '+video.publishedOn:'')+(video.chapterText?' · 作者标注 '+video.chapterText:'')+' · 原平台观看 · 分店待核对';link.append(title,note);videos.append(link);
    }
    byId('food-video-section').hidden=videos.childElementCount===0;this.refreshSaved(false);
    if(!byId('food-dialog').open)byId('food-dialog').showModal();
  }
  toggleSave(id){
    if(!this.records.some(item=>item.id===id))return;
    const removed=this.saved.includes(id),at=this.saved.indexOf(id);
    this.saved=removed?this.saved.filter(x=>x!==id):[...this.saved,id];this.persistSaved();this.refreshSaved();
    byId('status').textContent=removed?'已从想去移除':'已加入第 '+this.saved.length+' 站想去';
    if(removed&&byId('wants-dialog').open&&!byId('food-dialog').open){
      const row=byId('wants-list').children[Math.min(at,this.saved.length-1)];
      (row?.querySelector('.want-item')||byId('wants-close')).focus({preventScroll:true});
    }
  }
  persistSaved(){
    try{localStorage.setItem('foodcity:wants:chongqing:v1',JSON.stringify(this.saved));this.saveError=false;}
    catch{this.saveError=true;}
  }
  moveStop(id,direction){
    const from=this.saved.indexOf(id),to=from+direction;
    if(![-1,1].includes(direction)||from<0||to<0||to>=this.saved.length)return;
    [this.saved[from],this.saved[to]]=[this.saved[to],this.saved[from]];this.persistSaved();this.refreshSaved();
    const row=[...byId('wants-list').children].find(row=>row.dataset.savedId===id);
    const preferred=row?.querySelector(direction<0?'.trip-up':'.trip-down');
    (preferred&&!preferred.disabled?preferred:row?.querySelector('.trip-move:not(:disabled)')||row?.querySelector('.want-item'))?.focus({preventScroll:true});
    byId('status').textContent=(this.records.find(item=>item.id===id)?.name||'这一站')+'已移到第 '+(to+1)+' 站';
  }
  refreshSaved(renderList=true){
    byId('wants-count').textContent=String(this.saved.length);
    byId('wants-open').setAttribute('aria-label','查看想去清单，'+this.saved.length+'家');
    const selected=this.selected&&this.saved.includes(this.selected.id);
    byId('food-save').textContent=selected?'已加入想去 ✓':'加入想去 ＋';byId('food-save').setAttribute('aria-pressed',String(!!selected));
    this.overlay.setState(this.selected?.id,this.saved);
    this.renderDock();
    if(byId('food-pick-dialog').open)this.renderPickerResults();
    if(renderList&&byId('wants-dialog').open)this.renderWants();
    byId('trip-save-note').hidden=!this.saveError;
    byId('trip-save-note').textContent=this.saveError?'本次调整暂未保存到浏览器。刷新前可再次调整以重试。':'';
  }
  openWants(opener){
    this.overlay.popover.close();
    this.wantsOpener=opener;this.renderWants();
    if(!byId('wants-dialog').open)byId('wants-dialog').showModal();
  }
  renderDock(){
    const count=this.saved.length,dock=byId('trip-dock');
    dock.hidden=!(this.active&&this.phase==='loaded');
    byId('food-pick-tools').hidden=dock.hidden;
    byId('trip-dock-title').textContent=count?count+' 站想去':'留住想吃的这一口';
    const routeRecords=this.saved.map(id=>this.records.find(item=>item.id===id)).filter(Boolean),visible=new Set(this.visibleRecords().map(item=>item.id));
    const showRoute=this.active&&!this.routeSuppressed&&routeRecords.length>1&&routeRecords.every(item=>visible.has(item.id));
    this.routePreview.update(routeRecords,showRoute);
    byId('trip-dock-caption').textContent=this.saveError?'本次调整暂未保存':showRoute?'直线约 '+directDistanceText(this.routePreview.total):count?'按你的顺序，慢慢逛':'点选美食卡片开始';
    byId('trip-open').setAttribute('aria-label',count?'安排想去行程，'+count+'站':'打开想去清单');
    byId('trip-overview').hidden=count===0;byId('trip-manage').hidden=count===0;
    const stops=byId('trip-stops');stops.replaceChildren();stops.hidden=count===0;
    for(const [index,id]of this.saved.entries()){
      const item=this.records.find(item=>item.id===id);if(!item)continue;
      const button=document.createElement('button');button.type='button';button.className='trip-stop';button.dataset.savedId=id;button.title=item.name;
      button.setAttribute('aria-label','在地图上查看第 '+(index+1)+' 站，'+item.name);
      const number=document.createElement('span');number.className='trip-number';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.textContent=item.category;button.append(number,name);
      button.addEventListener('click',()=>this.focusStops(id));stops.append(button);
    }
    this.overlay.scheduleLayout();
  }
  setRouteSuppressed(value){this.routeSuppressed=value;this.renderDock();if(value)this.overlay.popover.close();}
  fitPadding(){
    const bounds=this.map.getContainer().getBoundingClientRect(),{width,height}=bounds,side=Math.min(width*.16,250);
    const controls=[byId('trip-dock'),document.querySelector('.view-dock')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
    const bottom=controls.length?height-Math.min(...controls.map(r=>r.top-bounds.top))+28:140;
    return {top:Math.min(innerWidth<600?230:250,height*.4),bottom:Math.min(Math.max(140,bottom),height*.48),left:side,right:side};
  }
  focusStops(id=null){
    if(this.phase!=='loaded'||!this.active)return;
    const records=id?this.records.filter(item=>item.id===id):this.saved.map(id=>this.records.find(item=>item.id===id)).filter(Boolean);
    if(!records.length)return;
    if(records.some(item=>!this.visibleRecords().some(visible=>visible.id===item.id))){this.category=null;this.renderCandidates();}
    this.selected=id?records[0]:null;this.overlay.setState(id,this.saved);
    this.frameRecords(records);
    byId('status').textContent=id?'已定位'+records[0].name+'的来源地点，门口待确认':'已在地图上展示 '+records.length+' 个想去地点，尚未生成到店路线';
  }
  frameRecords(records){
    if(!records.length)return;
    this.cancelFocus();this.onExplore();
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:850;
    if(records.length===1){
      this.map.easeTo({center:records[0].coordinates,zoom:Math.max(16.3,Math.min(this.map.getZoom(),17.5)),offset:[0,Math.min(70,innerHeight*.08)],duration});
    }else{
      const points=records.map(item=>item.coordinates);
      this.map.fitBounds([[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]],{padding:this.fitPadding(),maxZoom:16.3,pitch:this.map.getPitch(),bearing:this.map.getBearing(),duration});
    }
  }
  renderWants(){
    const list=byId('wants-list');list.replaceChildren();byId('wants-empty').hidden=this.saved.length>0;
    byId('trip-map-all').hidden=this.saved.length===0;byId('trip-order-note').hidden=this.saved.length===0;
    for(const [index,id]of this.saved.entries()){
      const item=this.records.find(r=>r.id===id);if(!item)continue;
      const row=document.createElement('li'),open=document.createElement('button'),remove=document.createElement('button');
      row.className='trip-row';row.dataset.savedId=id;
      const number=document.createElement('span');number.className='trip-order';number.textContent=String(index+1);number.setAttribute('aria-label','第 '+(index+1)+' 站');
      open.className='want-item';open.type='button';
      open.setAttribute('aria-label','查看行程中的'+item.name+'详情');
      const thumb=thumbFor(item,'trip-thumb');
      const copy=document.createElement('span');copy.className='trip-item-copy';
      const title=document.createElement('strong');title.textContent=item.name;
      const note=document.createElement('small');note.textContent=item.category+' · 店址待核实';copy.append(title,note);open.append(thumb,copy);
      open.addEventListener('click',()=>this.open(item));
      const actions=document.createElement('div');actions.className='trip-row-actions';
      const locate=document.createElement('button');locate.className='trip-locate';locate.type='button';locate.textContent='看位置';locate.setAttribute('aria-label','在地图上查看'+item.name+'的位置');locate.addEventListener('click',()=>{byId('wants-dialog').close();this.focusStops(id);});actions.append(locate);
      for(const [direction,text,extra]of [[-1,'↑','trip-up'],[1,'↓','trip-down']]){
        const button=document.createElement('button');button.type='button';button.className='trip-move '+extra;button.textContent=text;button.disabled=index+direction<0||index+direction>=this.saved.length;
        button.setAttribute('aria-label',(direction<0?'上移':'下移')+item.name);button.addEventListener('click',()=>this.moveStop(id,direction));actions.append(button);
      }
      remove.className='close trip-remove';remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','从想去移除'+item.name);remove.addEventListener('click',()=>this.toggleSave(id));actions.append(remove);
      row.append(number,open,actions);list.append(row);
    }
  }
  getStats(){return {phase:this.phase,active:this.active,selected:this.selected?.id||null,saved:[...this.saved],records:this.records.length,visibleRecords:this.visibleRecords().length,category:this.category,error:this.error||null,saveError:!!this.saveError};}
}
