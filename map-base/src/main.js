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

const $=(id)=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={threeD:true,labels:true,buildings:true,terrain:true,ready:false};
const failures=[];
const boot=window.__FOOD_MAP_BOOT__;
let map,city,roads=[],overlay,selectedRoad=null,streets,food,walk,landmark,videoMapContext,landmarkFocus=false;
const duration=()=>reduced.matches?0:800;
const protocol=new Protocol();
const bundle=window.__FOOD_CITY_BUNDLE__;
// The .cjs suffix tells MapLibre to create a classic Worker, including for Blob URLs.
const workerURL=bundle?URL.createObjectURL(new Blob([bundle.worker],{type:'application/javascript'}))+'#map-worker.cjs':new URL('map-worker.cjs',location.href).href;
maplibregl.setWorkerUrl(workerURL);
maplibregl.addProtocol('pmtiles',protocol.tile);

async function readJSON(path,{signal}={}) {
  if(bundle?.json[path])return bundle.json[path];
  const response=await fetch(path,{signal});
  if(!response.ok)throw new Error(path+' 加载失败（'+response.status+'）');
  return response.json();
}
function fail(message) {
  boot.fail(message,failures.join('\n'));
}
function layersVisible() {
  for(const id of labelLayers)map.setLayoutProperty(id,'visibility',state.labels&&!streets?.active?'visible':'none');
  streets?.setLabels(state.labels);
  map.setLayoutProperty('buildings-3d','visibility',state.threeD&&state.buildings?'visible':'none');
  map.setLayoutProperty('buildings-flat','visibility',state.threeD&&state.buildings?'none':'visible');
  for(const id of ['landmarks','places'])map.setLayoutProperty(id,'visibility',landmarkFocus?'none':'visible');
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
  map.setTerrain(state.terrain?{source:'dem',exaggeration:1}:null);
  map.setLayoutProperty('hill-shade','visibility',state.terrain?'visible':'none');
}
function view(threeD) {
  videoMapContext?.clear();
  endLandmarkFocus();
  streets?.cancelFocus();
  food?.cancelFocus();
  walk?.cancelFocus();
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
    empty.textContent='当前城区地图中未找到这条路，试试“沧白路”。';results.append(empty);return;
  }
  for(const road of matches) {
    const button=document.createElement('button');button.type='button';
    const name=document.createElement('span');name.textContent=road.name;
    const note=document.createElement('small');note.textContent='重庆 · '+roadDescription(road);
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
  $('reset-view').addEventListener('click',()=>{
    videoMapContext?.clear();
    endLandmarkFocus();
    streets?.cancelFocus();
    food?.cancelFocus();
    walk?.hide();
    clearRoad();map.easeTo({center:city.center,zoom:city.zoom,pitch:state.threeD?city.pitch:0,bearing:state.threeD?city.bearing:0,duration:duration()});
  });
  $('labels-option').addEventListener('change',e=>{state.labels=e.target.checked;layersVisible();});
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
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLayers();$('search-results').hidden=true;}});
  map.on('click',event=>{
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

async function init() {
  boot.stage('读取城市配置');
  const config=await readJSON('config/cities.json');
  city=config.cities[config.activeCity];
  if(!city)throw new Error('当前城市尚未配置');
  const [index,manifest,audit]=await Promise.all([
    readJSON(city.dataFiles.index),readJSON(city.dataFiles.manifest),readJSON(city.dataFiles.audit)
  ]);
  if(index.city!==config.activeCity)throw new Error('城市索引与当前地图不一致');
  roads=index.roads;
  document.title='食途 · '+city.name+'地图';
  $('search-input').setAttribute('aria-label','搜索'+city.name+'道路');
  $('coverage-description').textContent=city.coverageLabel;
  document.querySelector('.city-chip').replaceChildren(document.createTextNode(city.name));
  const region=document.createElement('span');region.textContent=' · '+city.regionLabel;document.querySelector('.city-chip').append(region);
  const tileURL=new URL(city.tiles,location.href).href;
  boot.stage('准备地图数据与后台绘图程序');
  if(bundle){
    const raw=atob(bundle.archive),bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    protocol.add(new PMTiles({getKey:()=>tileURL,getBytes:async(offset,length)=>({data:bytes.slice(offset,offset+length).buffer})}));
  }
  map=new maplibregl.Map({
    container:'map',style:makeStyle(city,tileURL),center:city.center,zoom:city.zoom,
    pitch:city.pitch,bearing:city.bearing,minZoom:city.minZoom,maxZoom:city.maxZoom,maxPitch:68,
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
      terrainVisible();layersVisible();overlay?.scheduleLayout();
      $('status').textContent='地图绘图已恢复，暂以平面地形显示。';
    };
    if(map.isStyleLoaded())restore();else map.once('style.load',restore);
  });
  map.once('style.load',()=>{
    boot.stage('绘制重庆真实道路');
    terrainVisible();layersVisible();wire();
    landmark=new HongyadongLayer(maplibregl.MercatorCoordinate,{onError:error=>{
      console.error('[landmark]',error.message);
      $('landmark-note').hidden=false;$('landmark-note').textContent='洪崖洞细节暂未载入，真实地图仍可使用。';
      $('landmark-entry').disabled=true;
    }});
    try{map.addLayer(landmark,'selected-road-edge');layersVisible();}
    catch(error){landmark.error=error.message;landmark.onError(error);}
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
      config:city.foodContent,readJSON,assetURL:path=>bundle?.assets?.[path]||new URL(path,location.href).href,
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
  function checkReady() {
    if(state.ready||!overlay||!map.getLayer(roadHitLayers[0]))return;
    // Road rendering is the base readiness signal. Optional DEM must not hide it.
    if(map.isSourceLoaded('city')&&map.queryRenderedFeatures({layers:roadHitLayers}).length>0){
      state.ready=true;boot.ready();$('status').textContent=city.name+'地图已展开';
      const query=new URLSearchParams(location.search),initialView=query.get('view');
      if(initialView==='street'||location.hash==='#street')void streets?.focus();
      if(initialView==='food'||(!initialView&&query.has('place')))void food?.activate();
      if(initialView==='walk')void walk?.show();
      if(initialView==='landmark')focusLandmark();
    }
  }
  map.on('render',checkReady);
  map.on('idle',checkReady);
  $('source-date').textContent=manifest.upstreamBuild.key.replace('.pmtiles','').replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
  $('source-stats').textContent='当前可搜索 '+roads.length.toLocaleString()+' 组源道路名称。按源名称合并的道路可能包含多段路面、桥梁或隧道。';
  window.foodCityMap={
    map,city,manifest,audit,
    get ready(){return state.ready;},
    get street(){return streets;},
    get food(){return food;},
    get walk(){return walk;},
    get landmark(){return landmark;},
    get videoContext(){return videoMapContext;},
    getStats:()=>({ready:state.ready,center:map.getCenter().toArray(),zoom:map.getZoom(),pitch:map.getPitch(),terrain:!!map.getTerrain(),elevationMetres:map.queryTerrainElevation(map.getCenter()),roadNameGroups:roads.length,renderedRoadFragments:map.getLayer(roadHitLayers[0])?map.queryRenderedFeatures({layers:roadHitLayers}).length:0,selectedRoad:selectedRoad?.name||null,foodCards:overlay?.markers.length||0,failures:[...failures]}),
    findRoad:name=>roads.find(r=>r.name===name),
    focusRoad:name=>{const road=roads.find(r=>r.name===name);if(!road)throw new Error('道路未找到');selectRoad(road);},
    setFoodCards:(records,onOpen)=>{if(!overlay)throw new Error('地图尚未就绪');return overlay.replace(records,onOpen);},
    clearFoodCards:()=>overlay?.clear(),
    setView:view
  };
}
const videoLibrary=new VideoLibrary({onMapPlace:async segment=>{
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
init().catch(error=>{console.error(error);fail('本地数据未准备完整：'+error.message);});
