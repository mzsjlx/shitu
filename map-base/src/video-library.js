import {validateVideoLibrary,clockText,amapSearchUrl,localVideoAsset} from './video-library-model.js';
import './video-library.css';
import {validateVideoMapContexts} from './video-map-context-model.js';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export class VideoLibrary{
  constructor({onMapContext,onMapPlace,cityId,cityConfig}={}){
    this.onMapContext=onMapContext;this.onMapPlace=onMapPlace;
    this.cityId=cityId||'chongqing';this.cityConfig=cityConfig;
    this.dialog=document.getElementById('video-library-dialog');this.grid=document.getElementById('video-library-grid');this.player=document.getElementById('video-library-player');this.sources=document.getElementById('video-library-sources');this.message=document.getElementById('video-library-message');this.status=document.getElementById('video-library-status');this.generation=0;
    document.getElementById('video-library-open').addEventListener('click',event=>this.open(event.currentTarget));
    document.getElementById('video-library-close').addEventListener('click',()=>this.dialog.close());
    document.getElementById('video-library-retry').addEventListener('click',()=>this.load());
    document.getElementById('video-library-search').addEventListener('input',()=>this.renderCards());
    document.getElementById('video-library-choose').addEventListener('click',()=>{const browse=this.grid.parentElement,body=browse.parentElement;body.scrollTop+=browse.getBoundingClientRect().top-body.getBoundingClientRect().top;document.getElementById('video-library-search').focus({preventScroll:true});});
    this.dialog.addEventListener('close',()=>{this.generation++;this.controller?.abort();this.stop();if(this.closeMode!=='map')this.opener?.focus({preventScroll:true});this.closeMode=null;});
    this.dialog.addEventListener('click',event=>{if(event.target!==this.dialog)return;const r=this.dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)this.dialog.close();});
    const query=new URLSearchParams(location.search);
    if(query.get('videos')==='1')this.open(document.getElementById('food-entry'),query.get('clip'));
  }
  stop(){const video=this.player.querySelector('video');if(video){video.pause();video.removeAttribute('src');video.load();}}
  async open(opener,clipId){
    const requested=clipId||this.selected;
    this.preferredClip=requested;
    const eyebrow=document.querySelector('.video-library-head .eyebrow');if(eyebrow&&this.cityConfig?.name)eyebrow.textContent=this.cityConfig.name+' · 跟着镜头找好吃的';
    this.opener=opener;if(!this.dialog.open)this.dialog.showModal();
    if(this.data){const source=this.data.sources.find(s=>s.segments.some(segment=>segment.id===requested));this.renderSource(source?.id||this.sourceId,requested);}else await this.load();
  }
  async load(){
    const generation=++this.generation;this.controller?.abort();this.controller=new AbortController();
    this.message.textContent='正在整理镜头里的店…';this.message.hidden=false;document.getElementById('video-library-retry').hidden=true;
    const timer=setTimeout(()=>this.controller.abort(),10000);
    try{
      if(!['http:','https:'].includes(location.protocol))throw new Error('请通过“打开地图.cmd”查看本地视频。');
      const get=async rel=>{const r=await fetch('./'+rel.replace(/^\.?\/?/,''),{signal:this.controller.signal});if(!r.ok)throw new Error('视频资料暂时未能读取，请重试。');return r.json();};
      const catalogRel=this.cityConfig?.foodContent?.videoLibrary||(this.cityId==='chongqing'?'data/video-library.json':`data/cities/${this.cityId}/video-library.json`);
      const contextsRel=(this.cityId==='chongqing')?'data/video-map-contexts.json':`data/cities/${this.cityId}/video-map-contexts.json`;
      const [data,assets,contextsData]=await Promise.all([
        get(catalogRel),
        get('data/video-library-assets.json').catch(()=>({schemaVersion:1,segments:{}})),
        get(contextsRel).catch(()=>({schemaVersion:1,city:this.cityId,contexts:[],reviews:[]}))
      ]);
      validateVideoLibrary(data,this.cityId);
      this.mapContexts=validateVideoMapContexts(contextsData,data,this.cityConfig?.bounds,this.cityId);
      if(assets.schemaVersion!==1||!assets.segments||Array.isArray(assets.segments))throw new Error('视频素材目录格式不正确。');
      if(generation!==this.generation||!this.dialog.open)return;
      this.data=data;this.assets=assets.segments;
      const count=data.sources.flatMap(s=>s.segments).filter(s=>this.asset(s)?.clip).length;
      const located=data.sources.flatMap(s=>s.segments).filter(s=>s.coordinates).length,pending=data.sources.flatMap(s=>s.segments).length-located;
      this.status.textContent=count?`${count} 个本地片段 · ${pending?pending+' 段位置待补':'位置大致'}`:'原片片段未导入本机 · 可查看来源与地址线索';
      this.sources.replaceChildren();
      for(const source of data.sources){const button=el('button','video-source-tab',source.author);button.type='button';button.dataset.source=source.id;button.append(el('span','',String(source.segments.length)));button.addEventListener('click',()=>this.renderSource(source.id));this.sources.append(button);}
      const source=data.sources.find(s=>s.segments.some(segment=>segment.id===this.preferredClip))||data.sources[0];this.renderSource(source.id,this.preferredClip);
    }catch(error){if(generation!==this.generation)return;this.message.textContent=error.name==='AbortError'?'视频资料读取超时，可以重试。':error.message;document.getElementById('video-library-retry').hidden=false;}
    finally{clearTimeout(timer);}
  }
  asset(segment){const a=this.assets?.[segment.id];const poster=localVideoAsset(a?.poster,'jpg'),clip=localVideoAsset(a?.clip,'mp4');return poster?{...a,poster,clip}:null;}
  renderSource(id,clipId){
    this.stop();this.sourceId=id;this.selected=null;document.getElementById('video-library-search').value='';
    for(const button of this.sources.children)button.setAttribute('aria-pressed',String(button.dataset.source===id));
    this.renderCards(clipId);
  }
  renderCards(preferredClip){
    const source=this.data.sources.find(s=>s.id===this.sourceId);if(!source)return;
    const filter=document.getElementById('video-library-search').value.trim().toLowerCase();
    const matches=source.segments.filter(segment=>!filter||segment.name.toLowerCase().includes(filter)||segment.category.toLowerCase().includes(filter)||segment.summary.toLowerCase().includes(filter)||segment.addressText?.toLowerCase().includes(filter));
    this.grid.replaceChildren();
    for(const segment of matches){
      const button=el('button','video-library-item');button.type='button';button.dataset.clip=segment.id;
      const asset=this.asset(segment);
      if(asset?.poster){const img=el('img','video-clip-thumb');img.src=asset.poster;img.alt=segment.name+' 视频画面';button.append(img);}
      else button.append(el('span','food-cover-pending','待导入'));
      const copy=el('div','video-clip-copy');copy.append(el('strong','',segment.name),el('span','',segment.category+' · '+clockText(segment.start)+'–'+clockText(segment.end)));button.append(copy);
      button.addEventListener('click',()=>this.play(source,segment,true));this.grid.append(button);
    }
    const target=matches.find(segment=>segment.id===(preferredClip||this.selected))||matches[0];
    if(target)this.play(source,target,false);
    else this.renderEmpty();
  }
  renderEmpty(){this.stop();this.player.replaceChildren(el('p','video-player-empty','这个作者没有匹配当前搜索的片段。'));}
  play(source,segment,scroll=false){
    this.stop();this.selected=segment.id;
    const asset=this.asset(segment),review=this.mapContexts?.reviews?.find(r=>r.segmentId===segment.id),context=this.mapContexts?.contexts?.find(c=>c.segmentIds.includes(segment.id));
    this.player.replaceChildren();
    this.player.append(el('span','video-player-kicker',source.author+(source.publishedOn?' · '+source.publishedOn:'')+' · 原片 '+clockText(segment.start)+'–'+clockText(segment.end)));
    if(asset?.clip){
      const video=el('video','video-player-media');video.controls=true;video.playsInline=true;video.preload='metadata';video.poster=asset.poster;video.src=asset.clip;video.setAttribute('aria-label',segment.name+'探店片段');
      const fallback=el('p','video-player-error','该片段暂时无法播放，可查看原视频。');fallback.hidden=true;video.addEventListener('error',()=>{if(video.getAttribute('src'))fallback.hidden=false;});this.player.append(video,fallback);
    }else{if(asset?.poster){const cover=el('img','video-player-media');cover.src=asset.poster;cover.alt=segment.name+' · 原视频画面';this.player.append(cover);}this.player.append(el('p','video-player-empty','视频剪辑待同步，可先查看封面、地址与原视频。'));}
    const titleRow=el('div','video-player-title-row');titleRow.append(el('h3','',segment.name));
    if(segment.coordinates&&typeof this.onMapPlace==='function'){
      const button=el('button','video-nearby-button','在地图看这家 ↗');button.type='button';button.addEventListener('click',async()=>{
        button.disabled=true;try{await this.onMapPlace(segment);this.stop();this.closeMode='map';this.dialog.close();}catch(error){this.status.textContent=error.message;}finally{button.disabled=false;}
      });titleRow.append(button);
    }
    if(context&&typeof this.onMapContext==='function'){
      const button=el('button','video-nearby-button','看看'+context.label+' ↗');button.type='button';button.addEventListener('click',async()=>{
        const generation=this.generation;button.disabled=true;button.setAttribute('aria-busy','true');
        try{const target=await this.onMapContext(context,segment);if(generation!==this.generation||!this.dialog.open)return;this.stop();this.closeMode='map';this.dialog.close();target?.focus({preventScroll:true});}
        catch(error){if(generation===this.generation){const feedback=el('p','video-context-error',error.message);feedback.setAttribute('role','alert');button.nextElementSibling?.classList.contains('video-context-error')&&button.nextElementSibling.remove();button.after(feedback);}}
        finally{button.disabled=false;button.removeAttribute('aria-busy');}
      });titleRow.append(button);
    }
    if(review){const details=el('details','video-address-review');details.append(el('summary','','店址核对说明'),el('p','',review.detail));for(const evidence of review.sources){const link=el('a','',evidence.label+' ↗');link.href=evidence.url;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}this.player.append(details);}
    this.player.append(el('small','video-player-category',segment.category),titleRow,el('p','video-player-summary',segment.summary));
    const address=el('div','video-player-address');address.append(el('small','',segment.addressOrigin==='name-address-crosscheck'?'店址核对':'原作者地址线索'),el('p','',segment.addressText||'原片未提供详细地址，选址时以分店为准。'));if(segment.addressNote)address.append(el('p','video-address-note',segment.addressNote));
    const searchUrl=amapSearchUrl(segment.name,this.cityConfig?.amapCityCode||'500000');
    if(searchUrl){const external=el('a','external-address-search','在外部地图查看同名分店 ↗');external.href=searchUrl;external.target='_blank';external.rel='noopener noreferrer';address.append(external);}
    this.player.append(address,this.sourceLink(source));
    for(const button of this.grid.children)button.setAttribute('aria-pressed',String(button.dataset.clip===segment.id));
    if(scroll&&matchMedia('(max-width:700px)').matches){this.player.parentElement.scrollTop=0;this.dialog.scrollTop=0;}
  }
  sourceLink(source){const p=el('p','video-source-info','来源作品：');const a=el('a','',source.author+' · 《'+source.title+'》 ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);return p;}
}
