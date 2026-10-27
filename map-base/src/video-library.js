import {validateVideoLibrary,clockText} from './video-library-model.js';
import './video-library.css';
import mapContextData from '../data/video-map-contexts.json';
import {validateVideoMapContexts} from './video-map-context-model.js';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const localAsset=(value,extension)=>typeof value==='string'&&new RegExp('^\\./media/videos/[a-z][a-z0-9-]*/[a-z][a-z0-9-]*\\.'+extension+'$').test(value)?value:null;
export class VideoLibrary{
  constructor({onMapContext}={}){
    this.onMapContext=onMapContext;
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
    this.opener=opener;if(!this.dialog.open)this.dialog.showModal();
    if(this.data){const source=this.data.sources.find(s=>s.segments.some(segment=>segment.id===requested));this.renderSource(source?.id||this.sourceId,requested);}else await this.load();
  }
  async load(){
    const generation=++this.generation;this.controller?.abort();this.controller=new AbortController();
    this.message.textContent='正在整理镜头里的店…';this.message.hidden=false;document.getElementById('video-library-retry').hidden=true;
    const timer=setTimeout(()=>this.controller.abort(),10000);
    try{
      if(!['http:','https:'].includes(location.protocol))throw new Error('请通过“打开地图.cmd”查看本地视频。');
      const get=async name=>{const r=await fetch('./data/'+name,{signal:this.controller.signal});if(!r.ok)throw new Error('视频资料暂时未能读取，请重试。');return r.json();};
      const [data,assets]=await Promise.all([get('video-library.json'),get('video-library-assets.json')]);
      validateVideoLibrary(data);this.mapContexts=validateVideoMapContexts(mapContextData,data);if(assets.schemaVersion!==1||!assets.segments||Array.isArray(assets.segments))throw new Error('视频素材目录格式不正确。');
      if(generation!==this.generation||!this.dialog.open)return;
      this.data=data;this.assets=assets.segments;
      const count=data.sources.flatMap(s=>s.segments).filter(s=>this.asset(s)).length;
      this.status.textContent=count?`${count} 个本地片段 · 分店位置待核对`:'原片片段未导入本机 · 可查看来源与地址线索';
      this.sources.replaceChildren();
      for(const source of data.sources){const button=el('button','video-source-tab',source.author);button.type='button';button.dataset.source=source.id;button.append(el('span','',String(source.segments.length)));button.addEventListener('click',()=>this.renderSource(source.id));this.sources.append(button);}
      const source=data.sources.find(s=>s.segments.some(segment=>segment.id===this.preferredClip))||data.sources[0];this.renderSource(source.id,this.preferredClip);
    }catch(error){if(generation!==this.generation)return;this.message.textContent=error.name==='AbortError'?'视频资料读取超时，可以重试。':error.message;document.getElementById('video-library-retry').hidden=false;}
    finally{clearTimeout(timer);}
  }
  asset(segment){const a=this.assets?.[segment.id];return localAsset(a?.clip,'mp4')&&localAsset(a?.poster,'jpg')?a:null;}
  renderSource(id,clipId){
    this.stop();this.sourceId=id;this.selected=null;document.getElementById('video-library-search').value='';
    for(const button of this.sources.children)button.setAttribute('aria-pressed',String(button.dataset.source===id));
    this.renderCards();
    const source=this.data.sources.find(s=>s.id===id);
    if(source.segments.length)this.select(source.segments.find(s=>s.id===clipId)||source.segments[0],false);else this.renderMissing(source);
  }
  renderCards(){
    if(!this.data)return;
    const source=this.data.sources.find(s=>s.id===this.sourceId),term=document.getElementById('video-library-search').value.trim().toLocaleLowerCase();
    this.grid.replaceChildren();
    const segments=source.segments.filter(s=>[s.name,s.category,s.addressText||''].join(' ').toLocaleLowerCase().includes(term));
    this.message.hidden=segments.length>0;
    if(!segments.length)this.message.textContent=source.segments.length?'还没找到这家店，试试店名或口味。':'这条原片尚未保存，先从原作者页面观看。';
    for(const segment of segments){
      const button=el('button','video-clip-card');button.type='button';button.dataset.clip=segment.id;button.setAttribute('aria-label','查看'+segment.name+'的视频片段');button.setAttribute('aria-pressed',String(this.selected===segment.id));
      const cover=el('div','video-clip-cover'),asset=this.asset(segment);
      if(asset){const image=el('img');image.src=asset.poster;image.alt=segment.name+' · 原视频画面';image.loading='lazy';image.addEventListener('error',()=>{image.hidden=true;},{once:true});cover.append(image);}
      else cover.append(el('span','video-cover-missing','原片素材待导入'));
      cover.append(el('span','video-clip-duration',Math.round(segment.end-segment.start)+' 秒'));
      const copy=el('div','video-clip-copy');copy.append(el('small','',segment.category),el('strong','',segment.name),el('span','',segment.addressText||'作者未提供详细地址'));
      button.append(cover,copy);button.addEventListener('click',()=>this.select(segment,true));this.grid.append(button);
    }
  }
  sourceLink(source){const link=el('a','video-original-link','到抖音看原视频 ↗');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';return link;}
  select(segment,scroll){
    this.stop();this.selected=segment.id;const source=this.data.sources.find(s=>s.id===this.sourceId),asset=this.asset(segment);
    const context=this.mapContexts.contexts.find(c=>c.segmentIds.includes(segment.id)),review=this.mapContexts.reviews.find(r=>r.segmentId===segment.id);
    this.player.replaceChildren();
    this.player.append(el('span','video-player-kicker',source.author+' · 原片 '+clockText(segment.start)+'—'+clockText(segment.end)));
    if(asset){
      const video=el('video','video-player-media');video.controls=true;video.playsInline=true;video.preload='metadata';video.poster=asset.poster;video.src=asset.clip;video.setAttribute('aria-label',segment.name+'的探店片段');
      const fallback=el('p','video-player-error','本机片段暂时无法播放，可以查看原视频。');fallback.hidden=true;video.addEventListener('error',()=>{if(video.getAttribute('src'))fallback.hidden=false;});this.player.append(video,fallback);
    }else this.player.append(el('p','video-player-empty','本机还没有这段视频文件，可先查看作者留下的店名与地址。'));
    const titleRow=el('div','video-place-title-row');titleRow.append(el('h3','',segment.name));
    this.player.append(el('small','video-player-category',segment.category),titleRow,el('p','video-player-summary',segment.summary));
    const address=el('div','video-player-address');address.append(el('small','','原作者地址线索'),el('p','',segment.addressText||'原片未提供详细地址，正在核对分店。'));if(segment.addressNote)address.append(el('p','video-address-note',segment.addressNote));this.player.append(address);
    this.player.append(el('p','video-location-note',review?.summary||'店址尚未对准地图，暂不加入到店路线。'));
    if(context&&typeof this.onMapContext==='function'){
      const button=el('button','video-nearby-button','看看'+context.label+' ↗');button.type='button';button.addEventListener('click',async()=>{
        const generation=this.generation;button.disabled=true;button.setAttribute('aria-busy','true');
        try{const target=await this.onMapContext(context,segment);if(generation!==this.generation||!this.dialog.open)return;this.stop();this.closeMode='map';this.dialog.close();target?.focus({preventScroll:true});}
        catch(error){if(generation===this.generation){const feedback=el('p','video-context-error',error.message);feedback.setAttribute('role','alert');button.nextElementSibling?.classList.contains('video-context-error')&&button.nextElementSibling.remove();button.after(feedback);}}
        finally{button.disabled=false;button.removeAttribute('aria-busy');}
      });titleRow.append(button);
    }
    if(review){const details=el('details','video-address-review');details.append(el('summary','','店址核对说明'),el('p','',review.detail));for(const evidence of review.sources){const link=el('a','',evidence.label+' ↗');link.href=evidence.url;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}this.player.append(details);}
    this.player.append(this.sourceLink(source));
    for(const button of this.grid.children)button.setAttribute('aria-pressed',String(button.dataset.clip===segment.id));
    if(scroll&&matchMedia('(max-width:700px)').matches){this.player.parentElement.scrollTop=0;this.dialog.scrollTop=0;}
  }
  renderMissing(source){this.player.replaceChildren(el('span','video-player-kicker',source.author),el('h3','','原片待补充'),el('p','video-player-empty','这条视频的网页可以播放，但目前未能保存完整原片。拿到原文件后，再逐家拆段和核对地址。'),this.sourceLink(source));}
}
