import {foodVideoCredit} from './food-video-credit.js';
import './food-popover.css';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};

function bilibiliPlayer(item){
  for(const video of item.videos||[]){
    try{
      const original=new URL(video.url);
      if(original.protocol!=='https:'||!['www.bilibili.com','bilibili.com'].includes(original.hostname))continue;
      const id=original.searchParams.get('bvid')||original.pathname.match(/\/video\/(BV[A-Za-z0-9]{10})/)?.[1];
      if(!/^BV[A-Za-z0-9]{10}$/.test(id||''))continue;
      const url=new URL('https://player.bilibili.com/player.html');
      url.searchParams.set('bvid',id);url.searchParams.set('autoplay','0');url.searchParams.set('danmaku','0');
      if(Number.isFinite(video.chapterSeconds)&&video.chapterSeconds>=0)url.searchParams.set('t',String(Math.floor(video.chapterSeconds)));
      return {url:url.href,original:original.href,author:video.author};
    }catch{}
  }
  return null;
}

export class FoodPopover{
  constructor(map){
    this.map=map;this.shell=map.getContainer().parentElement;this.wanted=new Set();this.current=null;this.pinned=false;
    this.element=el('section','food-inline-popover');this.element.hidden=true;this.element.setAttribute('aria-label','美食卡片预览');this.shell.append(this.element);
    this.element.addEventListener('pointerenter',()=>clearTimeout(this.leaveTimer));
    this.element.addEventListener('pointerleave',()=>this.scheduleClose());
    this.map.on('move',()=>this.position());this.map.on('resize',()=>this.position());
    this.map.on('click',()=>this.close());
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.current){event.stopPropagation();this.close();}});
  }
  setHandler(handler){this.onToggle=handler;}
  setWanted(wanted){this.wanted=new Set(wanted);this.updateSave();}
  updateSave(){
    if(!this.saveButton||!this.current)return;
    const saved=this.wanted.has(this.current.id);this.saveButton.textContent=saved?'已加入 ✓':'加入路线 ＋';
    this.saveButton.setAttribute('aria-pressed',String(saved));
    this.saveButton.setAttribute('aria-label',(saved?'从想去移除':'将')+this.current.name+(saved?'':'加入想去'));
  }
  show(item,entry,{pinned=false,clipId=null}={}){
    clearTimeout(this.leaveTimer);clearTimeout(this.hoverTimer);
    if(this.pinned&&!pinned&&this.current?.id!==item.id)return;
    if(this.current?.id===item.id&&(!clipId||clipId===this.clipId)){if(pinned)this.pinned=true;this.entry=entry;this.position();return;}
    const active=item.clips?.find(clip=>clip.id===clipId)||item.clips?.[0];
    this.clipId=active?.id||null;
    if(active)item={...item,photoURL:active.poster,localClip:active.clip,localPoster:active.poster,clipAuthor:active.author,clipFootageNote:active.footageNote,originalVideoURL:active.url,videos:[active]};
    this.stop();this.current=item;this.entry=entry;this.pinned=pinned;this.saveButton=null;
    const frame=el('div','food-popover-media');
    if(item.photoURL){const img=el('img');img.src=item.photoURL;img.alt=item.name+' · 原视频画面';frame.append(img);}
    else if(item.verificationStatus==='video-location'){frame.append(el('span','food-cover-pending','本机素材待导入'));}
    else if(item.spriteURL){const picture=el('div','food-popover-picture food-sprite');picture.style.backgroundImage='url('+JSON.stringify(item.spriteURL)+')';picture.style.backgroundPositionX=(item.spriteIndex*50)+'%';picture.setAttribute('role','img');picture.setAttribute('aria-label','通用菜品示意，非本店实拍');frame.append(picture,el('span','food-popover-image-note','菜品示意'));}
    const official=bilibiliPlayer(item),local=item.localClip&&item.localPoster?{clip:item.localClip,poster:item.localPoster}:null;
    const source=local||official;
    if(source){
      const play=el('button','food-popover-play','▶');play.type='button';play.setAttribute('aria-label','播放'+item.name+(local?'的视频片段':'的相关视频'));
      play.addEventListener('click',event=>{
        event.stopPropagation();this.pinned=true;frame.replaceChildren();
        if(local){
          const video=el('video','food-popover-video');video.controls=true;video.playsInline=true;video.preload='metadata';video.poster=local.poster;video.src=local.clip;video.setAttribute('aria-label',item.name+'的视频片段');
          video.addEventListener('error',()=>{if(this.current?.id===item.id)this.errorNote.textContent='视频暂时无法播放，可打开原视频。';});
          frame.append(video);video.play().catch(()=>{});
        }else{
          const iframe=el('iframe','food-popover-video');iframe.title=item.name+' · 相关视频，分店待核';iframe.allow='fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.src=official.url;frame.append(iframe);
        }
      });frame.append(play);
    }else frame.append(el('span','food-popover-missing',item.verificationStatus==='video-location'?'视频待同步':'视频待添加'));
    const close=el('button','food-popover-close','×');close.type='button';close.setAttribute('aria-label','关闭'+item.name+'预览');close.addEventListener('click',()=>{this.close();entry.button.focus({preventScroll:true});});
    const copy=el('div','food-popover-copy'),heading=el('div','food-popover-heading');
    const title=el('strong','',item.name),credit=foodVideoCredit(item),detail=el('small','',credit||'视频待添加');detail.title=credit||'';heading.append(title,detail);copy.append(heading);
    if(typeof this.onToggle==='function'){
      this.saveButton=el('button','food-popover-save');this.saveButton.type='button';this.saveButton.addEventListener('click',()=>this.onToggle(item));copy.append(this.saveButton);
    }
    this.errorNote=el('p','food-popover-error');this.errorNote.setAttribute('role','status');
    const links=el('div','food-popover-links');
    const choices=el('div','food-popover-clips');
    if(item.clips?.length>1)for(const clip of item.clips){
      const button=el('button','food-popover-clip',clip.author);button.type='button';button.dataset.clipId=clip.id;button.setAttribute('aria-pressed',String(clip.id===this.clipId));button.setAttribute('aria-label','切换到'+clip.author+'的'+item.name+'视频');
      button.addEventListener('click',()=>{this.show(item,entry,{pinned:true,clipId:clip.id});this.element.querySelector('[data-clip-id="'+clip.id+'"]')?.focus({preventScroll:true});});choices.append(button);
    }
    const originalURL=official?.original||item.originalVideoURL;
    if(originalURL){const link=el('a','','原视频 ↗');link.href=originalURL;link.target='_blank';link.rel='noopener noreferrer';links.append(link);if(official)links.append(el('small','food-popover-branch-note','相关视频 · 分店待核'));if(item.verificationStatus==='video-location'){const note=el('small','food-popover-branch-note','位置大致 · 分店待核');note.title=item.planningLocation?.note||'按地址街区估计';links.append(note);}}
    if(item.clipFootageNote){const note=el('small','food-popover-branch-note',item.clipFootageNote);links.append(note);}
    this.element.classList.toggle('has-clip-choices',choices.childElementCount>0);this.element.classList.toggle('has-footage-note',!!item.clipFootageNote);
    const details=el('div','food-popover-details');details.append(copy,choices,this.errorNote,links);
    this.element.replaceChildren(frame,close,details);this.element.hidden=false;this.element.classList.remove('is-shown');
    this.updateSave();this.position();requestAnimationFrame(()=>{if(this.current?.id===item.id)this.element.classList.add('is-shown');});
  }
  position(){
    if(!this.current||!this.entry||this.element.hidden)return;
    const shell=this.shell.getBoundingClientRect(),card=this.entry.element.getBoundingClientRect(),gap=12;
    // Size against the visible map area; a short landscape screen has less space below the toolbar.
    const visibleTop=Math.max(0,shell.top),visibleBottom=Math.min(innerHeight,shell.bottom),availableHeight=Math.max(0,Math.floor(visibleBottom-visibleTop-gap*2));
    this.element.classList.remove('is-height-limited');
    this.element.style.setProperty('--food-popover-available-height',availableHeight+'px');
    this.element.style.setProperty('--food-popover-media-height',(availableHeight*2/3)+'px');
    this.element.classList.toggle('is-height-limited',this.element.offsetHeight>availableHeight);
    const w=this.element.offsetWidth,h=this.element.offsetHeight;
    const obstacles=[...this.shell.querySelectorAll('.food-card,.food-distance-badge,#trip-dock,.view-dock,#food-pick-tools,.maplibregl-ctrl-top-right')]
      .filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect());
    const clamp=(value,max,min=gap)=>Math.max(min,Math.min(value,Math.max(min,max-gap)));
    const topInset=visibleTop-shell.top+gap,bottomLimit=visibleBottom-shell.top;
    const dock=this.shell.querySelector('#trip-dock'),dockTop=dock?.getClientRects().length?dock.getBoundingClientRect().top-shell.top:shell.height;
    const xs=[card.right-shell.left+gap,card.left-shell.left-w-gap,(card.left+card.right)/2-shell.left-w/2],ys=[card.top-shell.top-8,card.top-shell.top-h-gap,card.bottom-shell.top+gap,dockTop-h-gap];
    const options=[];
    for(const x of xs)for(const y of ys){
      const left=clamp(x,shell.width-w),top=clamp(y,bottomLimit-h,topInset),rect={left:shell.left+left,top:shell.top+top,right:shell.left+left+w,bottom:shell.top+top+h};
      const overlap=obstacles.reduce((sum,r)=>sum+Math.max(0,Math.min(rect.right,r.right)-Math.max(rect.left,r.left))*Math.max(0,Math.min(rect.bottom,r.bottom)-Math.max(rect.top,r.top)),0);
      options.push({left,top,score:overlap*8+Math.abs(left-x)*4+Math.abs(top-(card.top-shell.top-8))});
    }
    options.sort((a,b)=>a.score-b.score);const {left,top}=options[0];
    this.element.style.left=left+'px';this.element.style.top=top+'px';
  }
  scheduleHover(item,entry){clearTimeout(this.leaveTimer);clearTimeout(this.hoverTimer);this.hoverTimer=setTimeout(()=>this.show(item,entry),160);}
  scheduleClose(){clearTimeout(this.hoverTimer);clearTimeout(this.leaveTimer);if(!this.pinned)this.leaveTimer=setTimeout(()=>this.close(),220);}
  stop(){const video=this.element.querySelector('video');if(video){video.pause();video.removeAttribute('src');video.load();}const iframe=this.element.querySelector('iframe');if(iframe)iframe.remove();}
  close(){clearTimeout(this.leaveTimer);clearTimeout(this.hoverTimer);this.stop();this.current=null;this.entry=null;this.pinned=false;this.saveButton=null;this.element.classList.remove('is-shown');this.element.hidden=true;}
}
