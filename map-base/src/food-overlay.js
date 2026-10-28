import {FoodPopover} from './food-popover.js';
// This independent overlay consumes our content records, never a map provider's POI API.
const originalVideo=item=>{
  if(!Array.isArray(item.videos))return null;
  for(const video of item.videos){
    if(typeof video?.url!=='string')continue;
    try{const url=new URL(video.url);if(url.protocol==='https:'&&!url.username&&!url.password)return {...video,url:url.href};}catch{}
  }
  return null;
};
export class FoodOverlay {
  constructor(map, Marker, bounds) {
    this.map=map;this.Marker=Marker;this.bounds=bounds;this.markers=[];
    this.items=[];this.selected=null;this.wanted=new Set();
    this.popover=new FoodPopover(map);
    map.on('move',()=>this.scheduleLayout());
    map.on('resize',()=>this.scheduleLayout());
  }
  replace(records,onOpen=()=>{}) {
    this.validate(records,false);
    return this.render(records,onOpen);
  }
  replaceCandidates(records,onOpen=()=>{},options={}) {
    this.validate(records,true);
    return this.render(records,onOpen,options);
  }
  validate(records,candidates) {
    const ids=new Set();
    for(const item of records) {
      if(!item.id||ids.has(item.id)||!item.name)throw new Error('美食卡片需要唯一 ID 和名称');
      ids.add(item.id);
      if(item.coordinateSystem!=='WGS84')throw new Error('只接入 WGS84 门店坐标');
      if(candidates){
        const osm=item.verificationStatus==='source-record'&&item.coordinateEvidence?.kind==='osm-node'&&Number.isSafeInteger(item.coordinateEvidence.id)&&item.coordinateEvidence.id>0;
        const video=item.verificationStatus==='video-location'&&item.coordinateEvidence?.kind==='video-coordinate';
        if(!osm&&!video)throw new Error('候选卡片需要开放地图记录或视频门店坐标');
      }else if(item.verificationStatus!=='verified')throw new Error('只接入已核实的 WGS84 门店坐标');
      const p=item.coordinates,b=this.bounds;
      if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3])throw new Error('门店坐标超出当前地图覆盖区域');
    }
  }
  render(records,onOpen,{onToggleSave}={}){
    this.clear();
    this.popover.setHandler(onToggleSave);
    for(const item of records) {
      const element=document.createElement('div');element.className='food-card';element.dataset.foodId=item.id;
      element.setAttribute('role','group');element.setAttribute('aria-label',item.name+'美食卡片');
      element.addEventListener('click',event=>event.stopPropagation());
      const button=document.createElement('button');button.className='food-open';
      button.type='button';button.dataset.foodId=item.id;
      button.setAttribute('aria-label','查看'+item.name);
      if(item.photoURL){
        const photo=document.createElement('span');photo.className='food-photo';
        const image=document.createElement('img');image.src=item.photoURL;image.alt=item.name+' · 原视频画面';image.loading='lazy';photo.append(image);button.append(photo);
      }else if(item.spriteURL&&Number.isInteger(item.spriteIndex)&&item.spriteIndex>=0&&item.spriteIndex<3){
        const photo=document.createElement('span');photo.className='food-photo food-sprite';
        photo.style.backgroundImage='url('+JSON.stringify(item.spriteURL)+')';photo.style.backgroundPositionX=(item.spriteIndex*50)+'%';
        photo.setAttribute('role','img');photo.setAttribute('aria-label','通用菜品示意，非本店实拍');
        const note=document.createElement('small');note.className='photo-note';note.textContent='菜品示意';photo.append(note);button.append(photo);
      }
      const name=document.createElement('strong');name.textContent=item.name;button.append(name);
      if(item.verificationStatus==='source-record'||item.verificationStatus==='video-location'){
        const state=document.createElement('small');state.className='food-record-state';state.textContent=(item.category?item.category+' · ':'')+'店址待核实';button.append(state);
      }else if(item.category){const category=document.createElement('small');category.className='food-category';category.textContent=item.category;button.append(category);}
      button.addEventListener('click',event=>{event.stopPropagation();onOpen(item);});
      element.append(button);
      const actions=document.createElement('div');actions.className='food-actions';let saveButton=null;
      if(typeof onToggleSave==='function'){
        saveButton=document.createElement('button');saveButton.type='button';saveButton.className='food-quick-save';
        saveButton.addEventListener('click',event=>{event.stopPropagation();onToggleSave(item);});actions.append(saveButton);
      }
      const video=originalVideo(item);if(video&&!item.originalVideoURL)item.originalVideoURL=video.url;
      if(actions.childElementCount)element.append(actions);
      const dot=document.createElement('span');dot.className='food-pin';dot.setAttribute('aria-hidden','true');dot.textContent='●';element.append(dot);
      const marker=new this.Marker({element,anchor:'bottom',offset:[0,-4],pitchAlignment:'viewport',rotationAlignment:'viewport'}).setLngLat(item.coordinates).addTo(this.map);
      this.markers.push(marker);
      const entry={item,button,element,marker,saveButton};this.items.push(entry);
      if(typeof onToggleSave==='function'){
        button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches)this.popover.scheduleHover(item,entry);});
        button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))this.popover.show(item,entry);});
        element.addEventListener('pointerleave',()=>this.popover.scheduleClose());
      }
    }
    this.updateActions();
    this.scheduleLayout();
    return this.markers.length;
  }
  setState(selected,wanted){this.selected=selected;this.wanted=new Set(wanted);this.popover.setWanted(wanted);this.updateActions();this.scheduleLayout();}
  showPopover(item,pinned=true){const entry=this.items.find(value=>value.item.id===item.id);if(entry)this.popover.show(entry.item,entry,{pinned});}
  updateActions(){
    for(const {item,saveButton}of this.items){
      if(!saveButton)continue;const saved=this.wanted.has(item.id);
      saveButton.textContent=saved?'✓':'+';saveButton.setAttribute('aria-pressed',String(saved));
      saveButton.setAttribute('aria-label','将'+item.name+(saved?'从想去移除':'加入想去'));
    }
    this.popover.position();
  }
  setCompact(value){this.compact=value;this.scheduleLayout();}
  scheduleLayout(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=null;this.layout();});}
  layout(){
    const bounds=this.map.getContainer().getBoundingClientRect(),placed=[];
    const anchors=this.items.map(({item})=>{const p=this.map.project(item.coordinates);return {id:item.id,x:p.x+bounds.left,y:p.y+bounds.top};});
    const controls=[...document.querySelectorAll('.maplibregl-ctrl-top-right,.view-dock,#trip-dock,.street-tools,.walk-tools,#food-pick-tools,#walk-panel,.street-note,#road-info,#landmark-note,#video-map-note')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
    const ordered=[...this.items].sort((a,b)=>Number(b.item.id===this.selected)-Number(a.item.id===this.selected)||Number(this.wanted.has(b.item.id))-Number(this.wanted.has(a.item.id)));
    for(const entry of ordered){
      entry.element.classList.remove('is-collapsed');entry.marker.setOffset([0,-4]);
      entry.element.classList.toggle('is-wanted',this.wanted.has(entry.item.id));
      const r=entry.element.getBoundingClientRect();
      const overlaps=placed.some(p=>r.left<p.right+12&&r.right>p.left-12&&r.top<p.bottom+12&&r.bottom>p.top-12);
      const coversControl=controls.some(p=>r.left<p.right+8&&r.right>p.left-8&&r.top<p.bottom+8&&r.bottom>p.top-8);
      const coversOtherPoint=anchors.some(p=>p.id!==entry.item.id&&r.left<p.x+16&&r.right>p.x-16&&r.top<p.y+16&&r.bottom>p.y-16);
      const cropped=r.left<bounds.left+12||r.right>bounds.right-12||r.top<bounds.top+10||r.bottom>bounds.bottom-105;
      if(this.compact||cropped||coversControl||coversOtherPoint||(overlaps&&entry.item.id!==this.selected)){
        const focusedAction=entry.element.contains(document.activeElement)&&document.activeElement!==entry.button;
        entry.element.classList.add('is-collapsed');entry.marker.setOffset([0,14]);
        if(focusedAction&&getComputedStyle(entry.element).visibility!=='hidden')entry.button.focus({preventScroll:true});
      }
      else placed.push(r);
    }
    this.popover.position();
  }
  clear(){this.popover.close();if(this.frame)cancelAnimationFrame(this.frame);this.frame=null;for(const marker of this.markers)marker.remove();this.markers=[];this.items=[];}
}
