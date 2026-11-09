import * as maplibregl from 'maplibre-gl';
import {Protocol,PMTiles} from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import './landmark.css';
import {makeStyle,roadName,roadHitLayers,labelLayers} from './map-style.js';
import {FoodOverlay} from './food-overlay.js';
import {StreetDetail} from './street-detail.js';
import {FoodExperience} from './food-experience.js';
import {VideoLibrary} from './video-library.js';
import {VideoMapContext} from './video-map-context.js';
import {WalkPreview} from './walk-preview.js';
import {HongyadongLayer} from './hongyadong-layer.js';
import {registerPoiIcons} from './poi-icons.js';

const $=(id)=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={threeD:true,labels:true,buildings:true,terrain:true,pois:false,ready:false,orbitMode:false};
let orbitMoved=false;
const failures=[];
const boot=window.__FOOD_MAP_BOOT__;
let map,city,roads=[],overlay,selectedRoad=null,streets,food,walk,landmark,videoMapContext,landmarkFocus=false;
const duration=()=>reduced.matches?0:800;
const protocol=new Protocol();
const bundle=window.__FOOD_CITY_BUNDLE__;
// The .cjs suffix tells MapLibre to create a classic Worker, including for Blob URLs.
const workerURL=bundle?URL.createObjectURL(new Blob([bundle.worker],{type:'application/javascript'}))+'#map-worker.cjs':new URL('map-worker.cjs',location.href).href;
const roadWorkerURL=bundle?URL.createObjectURL(new Blob([bundle.roadWorker],{type:'application/javascript'}))+'#food-road-worker.cjs':new URL('food-road-worker.cjs',location.href).href;
maplibregl.setWorkerUrl(workerURL);
maplibregl.addProtocol('pmtiles',protocol.tile);

async function readJSON(path,{signal}={}) {
  if(bundle?.json[path])return bundle.json[path];
  const url = path + (path.includes('?') ? '&' : '?') + '_v=' + Date.now();
  const response=await fetch(url,{signal,cache:'no-store'});
  if(!response.ok)throw new Error(path+' 加载失败（'+response.status+'）');
  return response.json();
}
function fail(message) {
  boot.fail(message,failures.join('\n'));
}
function layersVisible() {
  for(const id of labelLayers)map.setLayoutProperty(id,'visibility',state.labels&&!streets?.active?'visible':'none');
  streets?.setLabels(state.labels);
  const showExtrusions = state.threeD && state.buildings;
  for (const id of ['buildings-3d', 'buildings-detail-3d']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showExtrusions ? 'visible' : 'none');
  }
  for (const id of ['buildings-flat', 'buildings-detail-flat']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showExtrusions ? 'none' : 'visible');
  }
  if(map.getLayer('places'))map.setLayoutProperty('places','visibility',landmarkFocus?'none':'visible');
  if(map.getLayer('poi-landmarks'))map.setLayoutProperty('poi-landmarks','visibility',state.pois&&!landmarkFocus?'visible':'none');
  landmark?.setAppearance(state.threeD&&state.buildings&&!streets?.active);
}
function endLandmarkFocus() {
  if(!landmarkFocus)return;
  landmarkFocus=false;$('landmark-note').hidden=true;
  document.querySelector('.map-shell').classList.remove('landmark-mode');
  streets?.setSuppressed(false);
  layersVisible();
  overlay?.scheduleLayout();
}
function focusLandmark() {
  if(!landmark)return;
  videoMapContext?.clear();
  streets?.cancelFocus();food?.cancelFocus();walk?.hide();clearRoad();closeLayers();
  landmarkFocus=true;state.threeD=true;state.buildings=true;
  $('buildings-option').checked=true;
  $('view-3d').classList.add('active');$('view-2d').classList.remove('active');
  $('view-3d').setAttribute('aria-pressed','true');$('view-2d').setAttribute('aria-pressed','false');
  document.querySelector('.map-shell').classList.add('landmark-mode');$('landmark-note').hidden=false;
  streets?.setSuppressed(true);layersVisible();
  map.easeTo({center:landmark.origin,zoom:innerWidth<600?16.75+Math.log2(innerWidth/390):17.65,pitch:64,bearing:142,duration:duration()});
  $('status').textContent='洪崖洞：按真实轮廓定位的美术模型';
}
function terrainVisible() {
  if (city?.demTiles && state.terrain) {
    map.setTerrain({source:'dem',exaggeration:1});
  } else {
    map.setTerrain(null);
  }
  if (map.getLayer('hill-shade')) {
    map.setLayoutProperty('hill-shade','visibility',state.terrain?'visible':'none');
  }
}
function toggleOrbitMode(enable) {
  const target = typeof enable === 'boolean' ? enable : !state.orbitMode;
  state.orbitMode = target;
  const btn = $('view-orbit');
  const container = map?.getCanvasContainer();
  const hintText = $('spatial-hint-text');
  const hint = $('spatial-hint');
  if (state.orbitMode) {
    if (!state.threeD || map.getPitch() < 10) {
      state.threeD = true;
      $('view-3d').classList.add('active');
      $('view-2d').classList.remove('active');
      $('view-3d').setAttribute('aria-pressed', 'true');
      $('view-2d').setAttribute('aria-pressed', 'false');
      layersVisible();
      map.easeTo({ pitch: 45, duration: 400 });
    }
    map.dragPan.disable();
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    }
    if (container) container.style.cursor = 'grab';
    if (hintText) hintText.innerHTML = '🔄 <strong>自由旋转已开启</strong>：按住<strong>鼠标左键</strong>拖动即可 360° 旋转与俯仰';
    if (hint) hint.hidden = false;
    $('status').textContent = '已开启自由旋转模式，直接按住鼠标左键即可 360° 旋转与俯仰';
  } else {
    map.dragPan.enable();
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
    if (container) container.style.cursor = '';
    if (hintText) hintText.innerHTML = '🔄 开启<strong>自由旋转</strong>或<strong>滚轮拖动</strong> 360°俯仰';
    $('status').textContent = '已退出自由旋转模式';
  }
}
function view(threeD) {
  videoMapContext?.clear();
  endLandmarkFocus();
  streets?.cancelFocus();
  food?.cancelFocus();
  walk?.cancelFocus();
  toggleOrbitMode(false);
  state.threeD=threeD;
  $('view-3d').classList.toggle('active',threeD);$('view-2d').classList.toggle('active',!threeD);
  $('view-3d').setAttribute('aria-pressed',String(threeD));$('view-2d').setAttribute('aria-pressed',String(!threeD));
  layersVisible();
  map.easeTo({pitch:threeD?city.pitch:0,bearing:threeD?city.bearing:0,duration:duration()});
}
function closeLayers() {
  $('layers-panel').hidden=true;$('layers-toggle').setAttribute('aria-expanded','false');
}
function showSources() {
  closeLayers();
  if(!$('source-dialog').open)$('source-dialog').showModal();
}
function roadDescription(road) {
  const tags=['命名道路'];
  if(road.bridge)tags.push('含桥梁路段');
  if(road.tunnel)tags.push('含隧道路段');
  return tags.join(' · ');
}
function selectRoad(road,move=true) {
  videoMapContext?.clear();
  endLandmarkFocus();
  streets?.cancelFocus();
  food?.cancelFocus();
  walk?.hide();
  streets?.clearSelection();
  document.querySelector('.road-source').textContent='道路资料：OpenStreetMap / Protomaps';
  selectedRoad=road;
  $('road-title').textContent=road.name||'未命名道路';
  $('road-meta').textContent=roadDescription(road);
  $('road-info').hidden=false;
  $('search-results').hidden=true;
  $('status').textContent='已找到'+road.name;
  const filter=road.name?['==',roadName,road.name]:['==',['id'],road.featureId??'__none__'];
  map.setFilter('selected-road-edge',filter);map.setFilter('selected-road',filter);
  if(move) {
    const b=road.bounds;
    map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{
      padding:innerWidth<600?{top:75,bottom:190,left:65,right:65}:{top:90,bottom:100,left:330,right:100},
      maxZoom:17,duration:duration(),pitch:state.threeD?44:0,bearing:state.threeD?city.bearing:0
    });
  }
}
function clearRoad() {
  selectedRoad=null;$('road-info').hidden=true;
  streets?.clearSelection();
  for(const id of ['selected-road-edge','selected-road'])map.setFilter(id,['==',roadName,'__none__']);
}
function matchingRoads(value) {
  const term=value.trim();
  if(!term)return [];
  return roads.filter(r=>r.name.includes(term)).sort((a,b)=>{
    const score=r=>r.name===term?0:r.name.startsWith(term)?1:2;
    return score(a)-score(b)||a.name.length-b.name.length||a.name.localeCompare(b.name,'zh-CN');
  }).slice(0,7);
}
function search() {
  const text=$('search-input').value.trim(),results=$('search-results');
  $('clear-search').hidden=!text;
  results.replaceChildren();results.hidden=!text;
  if(!text)return;
  const matches=matchingRoads(text);
  if(!matches.length){
    const empty=document.createElement('p');empty.className='search-empty';
    empty.textContent='当前城区地图中未找到这条路。';results.append(empty);return;
  }
  for(const road of matches) {
    const button=document.createElement('button');button.type='button';
    const name=document.createElement('span');name.textContent=road.name;
    const note=document.createElement('small');note.textContent=(city?.name||'城市')+' · '+roadDescription(road);
    button.append(name,note);button.addEventListener('click',()=>selectRoad(road));
    button.addEventListener('keydown',event=>{
      const list=[...results.querySelectorAll('button')],at=list.indexOf(button);
      if(event.key==='ArrowDown'){event.preventDefault();list[(at+1)%list.length].focus();}
      if(event.key==='ArrowUp'){event.preventDefault();if(at===0)$('search-input').focus();else list[at-1].focus();}
    });results.append(button);
  }
}
function wire() {
  $('view-3d').addEventListener('click',()=>view(true));
  $('view-2d').addEventListener('click',()=>view(false));
  $('view-orbit')?.addEventListener('click',()=>toggleOrbitMode());
  $('reset-view').addEventListener('click',()=>{
    videoMapContext?.clear();
    endLandmarkFocus();
    streets?.cancelFocus();
    food?.cancelFocus();
    walk?.hide();
    toggleOrbitMode(false);
    clearRoad();map.easeTo({center:city.center,zoom:city.zoom,pitch:state.threeD?city.pitch:0,bearing:state.threeD?city.bearing:0,duration:duration()});
  });
  $('labels-option').addEventListener('change',e=>{state.labels=e.target.checked;layersVisible();});
  $('pois-option')?.addEventListener('change',e=>{state.pois=e.target.checked;layersVisible();});
  $('landmark-entry').addEventListener('click',focusLandmark);
  $('buildings-option').addEventListener('change',e=>{state.buildings=e.target.checked;layersVisible();});
  $('terrain-option').addEventListener('change',e=>{state.terrain=e.target.checked;terrainVisible();});
  $('layers-toggle').addEventListener('click',()=>{
    const hidden=!$('layers-panel').hidden;$('layers-panel').hidden=hidden;
    $('layers-toggle').setAttribute('aria-expanded',String(!hidden));
  });
  $('layers-close').addEventListener('click',closeLayers);
  $('source-open').addEventListener('click',showSources);$('about-map').addEventListener('click',showSources);
  $('source-close').addEventListener('click',()=>$('source-dialog').close());
  $('source-dialog').addEventListener('click',e=>{if(e.target===$('source-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('road-close').addEventListener('click',clearRoad);
  $('search-input').addEventListener('input',e=>{if(!e.isComposing)search();});
  $('search-input').addEventListener('compositionend',search);
  $('search-input').addEventListener('focus',()=>{if($('search-input').value)search();});
  $('search-input').addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){const first=$('search-results').querySelector('button');if(first){e.preventDefault();first.focus();}}
  });
  $('clear-search').addEventListener('click',()=>{$('search-input').value='';search();$('search-input').focus({preventScroll:true});});
  $('road-search').addEventListener('submit',e=>{e.preventDefault();const first=matchingRoads($('search-input').value)[0];if(first)selectRoad(first);else search();});
  document.addEventListener('pointerdown',e=>{if(!$('road-search').contains(e.target))$('search-results').hidden=true;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLayers();$('search-results').hidden=true;if(state.orbitMode)toggleOrbitMode(false);}});
  map.on('click',event=>{
    if(orbitMoved)return;
    closeLayers();
    if(walk?.inspect(event.point))return;
    if(streets?.inspect(event.point))return;
    const p=event.point;
    const hits=map.queryRenderedFeatures([[p.x-8,p.y-8],[p.x+8,p.y+8]],{layers:roadHitLayers});
    const feature=hits.find(f=>f.properties['name:zh-Hans']||f.properties.name)||hits[0];
    if(!feature){clearRoad();return;}
    const props=feature.properties,name=props['name:zh-Hans']||props.name||'';
    const indexed=roads.find(r=>r.name===name);
    selectRoad(indexed||{name,featureId:feature.id,bridge:props.is_bridge===true,tunnel:props.is_tunnel===true},false);
  });
}

function enableSpatialControls(map) {
  const container = map.getCanvasContainer();

  // Prevent default context menu so right-click 3D orbit drag works smoothly
  container.addEventListener('contextmenu', e => e.preventDefault());

  let isOrbitDragging = false;
  let isMiddleDragging = false;
  let startX = 0, startY = 0;
  let startBearing = 0, startPitch = 0;

  container.addEventListener('pointerdown', e => {
    if (e.button === 0 && state.orbitMode) {
      isOrbitDragging = true;
      orbitMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      startBearing = map.getBearing();
      startPitch = map.getPitch();
      container.style.cursor = 'grabbing';
      try { container.setPointerCapture(e.pointerId); } catch (_) {}
    } else if (e.button === 1) {
      e.preventDefault();
      isMiddleDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startBearing = map.getBearing();
      startPitch = map.getPitch();
      container.style.cursor = 'grabbing';
      try { container.setPointerCapture(e.pointerId); } catch (_) {}
    }
  });

  window.addEventListener('pointermove', e => {
    if (!isOrbitDragging && !isMiddleDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      orbitMoved = true;
    }
    const bearing = startBearing + dx * 0.45;
    const pitch = Math.max(0, Math.min(85, startPitch - dy * 0.45));
    map.setBearing(bearing);
    map.setPitch(pitch);
  });

  window.addEventListener('pointerup', e => {
    if (isOrbitDragging && e.button === 0) {
      isOrbitDragging = false;
      if (state.orbitMode) container.style.cursor = 'grab';
      setTimeout(() => { orbitMoved = false; }, 80);
    }
    if (isMiddleDragging && e.button === 1) {
      isMiddleDragging = false;
      container.style.cursor = state.orbitMode ? 'grab' : '';
      setTimeout(() => { orbitMoved = false; }, 80);
    }
  });

  window.addEventListener('pointercancel', () => {
    isOrbitDragging = false;
    isMiddleDragging = false;
    container.style.cursor = state.orbitMode ? 'grab' : '';
    setTimeout(() => { orbitMoved = false; }, 80);
  });

  // Keyboard spatial street navigation (WASD, Q/E, R/F, Arrows)
  window.addEventListener('keydown', e => {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return;
    }
    const key = e.key.toLowerCase();
    const panStep = 65;
    const rotateStep = 6;
    const pitchStep = 5;

    switch (key) {
      case 'w':
      case 'arrowup':
        e.preventDefault();
        map.panBy([0, -panStep], { duration: 120 });
        break;
      case 's':
      case 'arrowdown':
        e.preventDefault();
        map.panBy([0, panStep], { duration: 120 });
        break;
      case 'a':
      case 'arrowleft':
        e.preventDefault();
        map.panBy([-panStep, 0], { duration: 120 });
        break;
      case 'd':
      case 'arrowright':
        e.preventDefault();
        map.panBy([panStep, 0], { duration: 120 });
        break;
      case 'q':
        e.preventDefault();
        map.easeTo({ bearing: map.getBearing() - rotateStep, duration: 120 });
        break;
      case 'e':
        e.preventDefault();
        map.easeTo({ bearing: map.getBearing() + rotateStep, duration: 120 });
        break;
      case 'r':
        e.preventDefault();
        map.easeTo({ pitch: Math.min(85, map.getPitch() + pitchStep), duration: 120 });
        break;
      case 'f':
        e.preventDefault();
        map.easeTo({ pitch: Math.max(0, map.getPitch() - pitchStep), duration: 120 });
        break;
    }
  });

  // Spatial hint dismissal
  const hint = $('spatial-hint');
  const closeBtn = $('spatial-hint-close');
  if (hint && closeBtn) {
    closeBtn.addEventListener('click', () => {
      hint.hidden = true;
    });
  }
}

async function init() {
  boot.stage('读取城市配置');
  const config=await readJSON('config/cities.json');
  let cityKey = null;
  try {
    const rawSearch = decodeURIComponent(location.search);
    const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch : '?' + rawSearch);
    cityKey = params.get('city');
    if (!cityKey) {
      for (const [k] of params.entries()) {
        if (k.startsWith('city=')) {
          cityKey = k.split('=')[1];
          break;
        }
      }
    }
  } catch (_) {
    cityKey = new URLSearchParams(location.search).get('city');
  }
  if (!cityKey) cityKey = config.activeCity;
  city = config.cities[cityKey];
  if (!city) throw new Error('城市“' + cityKey + '”尚未配置');
  if (bundle?.cityId && bundle.cityId !== cityKey) {
    location.replace(new URL('preview-' + cityKey + '.html' + location.search + location.hash, location.href));
    return;
  }
  const [index,manifest,audit]=await Promise.all([
    readJSON(city.dataFiles.index),readJSON(city.dataFiles.manifest),readJSON(city.dataFiles.audit)
  ]);
  if(index.city!==cityKey)throw new Error('城市索引与当前地图不一致');
  roads=index.roads;
  if (!city.demTiles) state.terrain = false;
  document.title='食途 · '+city.name+'地图';
  $('search-input').setAttribute('aria-label','搜索'+city.name+'道路');
  $('search-input').setAttribute('placeholder','找一条路，开始逛'+city.name);
  $('coverage-description').textContent=city.coverageLabel;
  if (city.buildingsDetail) {
    $('source-basemap-description').textContent = '道路、路名和河流来自开放地图数据。建筑采用开放轮廓与地标示意模型，地图包保存在本地。';
    $('building-height-note').textContent = '部分建筑缺少高度记录，按类型和底图等级估算楼高。地标分层和街区补绘为视觉示意。';
  }
  const citySelect=document.createElement('select');citySelect.setAttribute('aria-label','切换城市');
  for(const [id,value] of Object.entries(config.cities)){const option=document.createElement('option');option.value=id;option.textContent=value.name;citySelect.append(option);}citySelect.value=cityKey;
  citySelect.addEventListener('change',()=>{videoLibrary?.stop();overlay?.popover.close();const url=new URL(location.href);url.searchParams.set('city',citySelect.value);for(const key of ['place','clip','videos'])url.searchParams.delete(key);url.hash='';location.assign(url);});
  document.querySelector('.city-chip').replaceChildren(citySelect);
  const region=document.createElement('span');region.textContent=' · '+city.regionLabel;document.querySelector('.city-chip').append(region);
  $('search-input').placeholder='找一条路，开始逛'+city.name;
  document.querySelector('.map-shell').setAttribute('aria-label',city.name+'真实道路三维地图');
  $('loading').replaceChildren(document.createElement('span'),document.createTextNode('正在展开'+city.name+'…'));
  $('reset-view').setAttribute('aria-label','回到'+city.name+'初始视角');
  $('about-map').textContent=city.name+city.regionLabel+' · 自建底图 ⓘ';
  if ($('terrain-option')) {
    const terrainLabel = $('terrain-option').closest('label');
    if (!city.demTiles) {
      state.terrain = false;
      $('terrain-option').checked = false;
      $('terrain-option').disabled = true;
      if (terrainLabel) terrainLabel.style.display = 'none';
    } else {
      if (terrainLabel) {
        terrainLabel.style.display = '';
        terrainLabel.querySelector('small').textContent = '查看' + city.name + '的地形起伏';
      }
    }
  }
  const tileURL=new URL(city.tiles,location.href).href;
  boot.stage('准备地图数据与后台绘图程序');
  if(bundle){
    const raw=atob(bundle.archive),bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    protocol.add(new PMTiles({getKey:()=>tileURL,getBytes:async(offset,length)=>({data:bytes.slice(offset,offset+length).buffer})}));
  }
  map=new maplibregl.Map({
    container:'map',style:makeStyle(city,tileURL,bundle),center:city.center,zoom:city.zoom,
    pitch:city.pitch,bearing:city.bearing,minZoom:city.minZoom,maxZoom:city.maxZoom,maxPitch:85,
    maxBounds:[[city.bounds[0],city.bounds[1]],[city.bounds[2],city.bounds[3]]],
    canvasContextAttributes:{antialias:true},
    transformRequest:bundle?url=>{
      const relative=new URL(url,location.href).pathname.match(/data\/.+\.png$/)?.[0];
      if(relative&&bundle.terrain[relative])return {url:bundle.terrain[relative]};
      return {url};
    }:undefined,
    localIdeographFontFamily:'Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif',
    locale:{'Map.Title':city.name+'道路地图','NavigationControl.ZoomIn':'放大','NavigationControl.ZoomOut':'缩小','NavigationControl.ResetBearing':'拖动旋转地图，点击回到正北','AttributionControl.ToggleAttribution':'查看地图署名'},
    attributionControl:{compact:true},fadeDuration:180,refreshExpiredTiles:false,
    renderWorldCopies:false
  });
  enableSpatialControls(map);
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');
  map.addControl(new maplibregl.ScaleControl({maxWidth:110,unit:'metric'}),'bottom-left');
  function disableTerrain(message) {
    if(!state.terrain)return;
    state.terrain=false;
    $('terrain-option').checked=false;
    $('terrain-option').disabled=true;
    $('terrain-option').title='地形未能加载，已保留真实道路底图';
    map.setTerrain(null);
    if(map.getLayer('hill-shade'))map.setLayoutProperty('hill-shade','visibility','none');
    $('status').textContent=message;
  }
  map.on('error',event=>{
    const message=event.error?.message||String(event.error);
    failures.push(message);console.error('[map]',message);
    if(event.sourceId==='dem'||event.sourceId==='dem-shade'){
      disableTerrain('地形暂时不可用，真实道路底图仍可使用。');return;
    }
    if(!state.ready)fail('地图文件未能完整加载。请查看加载详情，或通过“打开地图.cmd”启动本地预览。');
  });
  map.on('webglcontextrestored',()=>{
    const restore=()=>{
      // The restored DEM render cache can expose stale textures on some GPUs.
      // Recover the city on flat ground; the user can explicitly retry terrain.
      state.terrain=false;$('terrain-option').checked=false;
      $('terrain-option').title='绘图恢复后暂以平面地形显示，可重新开启山地地形';
      // Custom layers cannot be serialized into MapLibre's recovery style.
      if(landmark&&!map.getLayer(landmark.id)){
        try{map.addLayer(landmark,'selected-road-edge');}
        catch(error){landmark.error=error.message;landmark.onError(error);}
      }
      registerPoiIcons(map);
      terrainVisible();layersVisible();overlay?.scheduleLayout();
      $('status').textContent='地图绘图已恢复，暂以平面地形显示。';
    };
    if(map.isStyleLoaded())restore();else map.once('style.load',restore);
  });
  map.once('style.load',()=>{
    boot.stage('绘制'+(city.name||'')+'真实道路');
    registerPoiIcons(map);
    terrainVisible();layersVisible();wire();
    if(city.landmarks?.includes('hongyadong')){
      landmark=new HongyadongLayer(maplibregl.MercatorCoordinate,{onError:error=>{
        console.error('[landmark]',error.message);
        $('landmark-note').hidden=false;$('landmark-note').textContent='洪崖洞细节暂未载入，真实地图仍可使用。';
        $('landmark-entry').disabled=true;
      }});
      try{map.addLayer(landmark,'selected-road-edge');layersVisible();}
      catch(error){landmark.error=error.message;landmark.onError(error);}
    } else {
      if ($('landmark-entry')) $('landmark-entry').hidden=true;
      if ($('landmark-note')) $('landmark-note').hidden=true;
    }
    if (!city.streetDetail) {
      const streetTools = document.querySelector('.street-tools');
      if (streetTools) streetTools.hidden = true;
      const streetOption = $('street-option')?.closest('label');
      if (streetOption) streetOption.style.display = 'none';
    }
    if (!city.walkNetwork) {
      const walkTools = document.querySelector('.walk-tools');
      if (walkTools) walkTools.hidden = true;
      const walkOption = $('walk-option')?.closest('label');
      if (walkOption) walkOption.style.display = 'none';
    }
    if (!city.foodContent) {
      const foodOption = $('food-option')?.closest('label');
      if (foodOption) foodOption.style.display = 'none';
      if ($('food-entry')) $('food-entry').style.display = 'none';
    }
    overlay=new FoodOverlay(map,maplibregl.Marker,city.bounds);
    videoMapContext=new VideoMapContext(map,{onBack:(id,opener)=>videoLibrary.open(opener,id),onLayout:()=>overlay.scheduleLayout()});
    if(city.streetDetail){
      const originalHeight=map.getPaintProperty('buildings-3d','fill-extrusion-height');
      const originalBase=map.getPaintProperty('buildings-3d','fill-extrusion-base');
      streets=new StreetDetail(map,{
        config:city.streetDetail,readJSON,
        onFocus:()=>{
          videoMapContext?.clear();
          endLandmarkFocus();
          food?.cancelFocus();
          walk?.hide();
          clearRoad();closeLayers();state.threeD=true;
          $('view-3d').classList.add('active');$('view-2d').classList.remove('active');
          $('view-3d').setAttribute('aria-pressed','true');$('view-2d').setAttribute('aria-pressed','false');layersVisible();
        },
        onAppearance:active=>{
          map.setPaintProperty('buildings-3d','fill-extrusion-height',active?['interpolate',['linear'],['zoom'],16.9,originalHeight,18.1,['min',22,['*',originalHeight,.13]]]:originalHeight);
          map.setPaintProperty('buildings-3d','fill-extrusion-base',active?0:originalBase);
          layersVisible();
        },
        onInspect:feature=>{
          selectedRoad={name:feature.name||feature.typeName};
          $('road-title').textContent=selectedRoad.name;
          $('road-meta').textContent=feature.typeName+(feature.illustrated?' · '+feature.lanes+' 车道源记录 · 路宽与分隔线示意':' · 开放资料中的地面线形');
          document.querySelector('.road-source').textContent='OpenStreetMap · way/'+feature.osmId+' · 尚未现场核实';
          $('road-info').hidden=false;$('search-results').hidden=true;
          for(const id of ['selected-road-edge','selected-road'])map.setFilter(id,['==',roadName,'__none__']);
        }
      });
    }
    if(city.foodContent)food=new FoodExperience(map,overlay,{
      cityId:cityKey,cityName:city.name,amapCityCode:city.amapCityCode||'500000',
      config:city.foodContent,readJSON,roadWorkerURL,assetURL:path=>bundle?.assets?.[path]||new URL(path,location.href).href,
      onFocus:()=>{
        videoMapContext?.clear();
        endLandmarkFocus();
        walk?.hide();
        streets?.cancelFocus();clearRoad();closeLayers();state.threeD=true;
        $('view-3d').classList.add('active');$('view-2d').classList.remove('active');
        $('view-3d').setAttribute('aria-pressed','true');$('view-2d').setAttribute('aria-pressed','false');layersVisible();
      },
      onExplore:()=>{
        videoMapContext?.clear();
        endLandmarkFocus();
        walk?.hide();streets?.cancelFocus();clearRoad();closeLayers();
      }
    });
    if(city.walkNetwork)walk=new WalkPreview(map,maplibregl.Marker,{
      path:city.walkNetwork,readJSON,onView:view,onAppearance:active=>{overlay.setCompact(active);food?.setRouteSuppressed(active);},
      onFocus:()=>{
        videoMapContext?.clear();
        endLandmarkFocus();
        streets?.cancelFocus();food?.cancelFocus();clearRoad();closeLayers();state.threeD=true;
        $('view-3d').classList.add('active');$('view-2d').classList.remove('active');
        $('view-3d').setAttribute('aria-pressed','true');$('view-2d').setAttribute('aria-pressed','false');layersVisible();
      }
    });
  });
  let readyInterval;
  function checkReady() {
    if(state.ready||!overlay)return;
    const availableRoadLayers = roadHitLayers.filter(id => map.getLayer(id));
    if(availableRoadLayers.length === 0)return;
    const renderedRoadCount = map.queryRenderedFeatures({layers: availableRoadLayers}).length;
    // Road rendering is the base readiness signal. Once road features are rendered on screen, map is ready.
    if(renderedRoadCount > 0 || (map.isSourceLoaded('city') && map.queryRenderedFeatures().length > 0)){
      state.ready=true;
      if (readyInterval) clearInterval(readyInterval);
      boot.ready();$('status').textContent=city.name+'地图已展开';
      const query=new URLSearchParams(location.search),initialView=query.get('view');
      if(initialView==='street'||location.hash==='#street')void streets?.focus();
      if(initialView==='food'||(!initialView&&query.has('place')))void food?.activate();
      if(initialView==='walk')void walk?.show();
      if(initialView==='landmark')focusLandmark();
    }
  }
  readyInterval = setInterval(checkReady, 200);
  map.on('render',checkReady);
  map.on('idle',checkReady);
  map.on('sourcedata',checkReady);
  $('source-date').textContent=manifest.upstreamBuild.key.replace('.pmtiles','').replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
  $('source-stats').textContent='当前可搜索 '+roads.length.toLocaleString()+' 组源道路名称。按源名称合并的道路可能包含多段路面、桥梁或隧道。';
  videoLibrary=new VideoLibrary({cityId:cityKey,cityConfig:city,onMapPlace:async segment=>{
    if(!state.ready||!food)throw new Error('地图还在展开，稍后再试。');
    await food.activate();const item=food.records.find(item=>item.id==='video-'+(segment.placeId||segment.id));
    if(!item)throw new Error('这家店暂不在当前地图范围。');
    food.focusStops(item.id);food.overlay.showPopover(item,true,segment.id);
  },onMapContext:(context,segment)=>{
    if(!state.ready||!videoMapContext)throw new Error('地图还在展开，稍后再试。');
    endLandmarkFocus();streets?.cancelFocus();food?.cancelFocus();walk?.hide();clearRoad();closeLayers();
    if($('food-pick-dialog').open)$('food-pick-dialog').close();
    return videoMapContext.show(context,segment,{threeD:state.threeD,bearing:city.bearing,duration:duration()});
  }});
  window.foodCityMap={
    map,city,manifest,audit,
    get ready(){return state.ready;},
    get orbitMode(){return state.orbitMode;},
    toggleOrbitMode,
    get street(){return streets;},
    get food(){return food;},
    get walk(){return walk;},
    get landmark(){return landmark;},
    get videoContext(){return videoMapContext;},
    get videoLibrary(){return videoLibrary;},
    getStats:()=>({ready:state.ready,center:map.getCenter().toArray(),zoom:map.getZoom(),pitch:map.getPitch(),terrain:!!map.getTerrain(),elevationMetres:map.queryTerrainElevation(map.getCenter()),roadNameGroups:roads.length,renderedRoadFragments:map.getLayer(roadHitLayers[0])?map.queryRenderedFeatures({layers:roadHitLayers}).length:0,selectedRoad:selectedRoad?.name||null,foodCards:overlay?.markers.length||0,failures:[...failures]}),
    findRoad:name=>roads.find(r=>r.name===name),
    focusRoad:name=>{const road=roads.find(r=>r.name===name);if(!road)throw new Error('道路未找到');selectRoad(road);},
    setFoodCards:(records,onOpen)=>{if(!overlay)throw new Error('地图尚未就绪');return overlay.replace(records,onOpen);},
    clearFoodCards:()=>overlay?.clear(),
    setView:view
  };
}
let videoLibrary;
init().catch(error=>{console.error(error);fail('本地数据未准备完整：'+error.message);});
