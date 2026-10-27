import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PMTiles} from 'pmtiles';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.local/poi-scan');
const config=JSON.parse(await readFile(path.join(root,'config/cities.json'),'utf8')).cities.chongqing;
const library=JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8'));
const targets=library.sources.flatMap(s=>s.segments).map(s=>({id:s.id,name:s.name,address:s.addressText}));
const manifest=JSON.parse(await readFile(path.join(root,'data/source-manifest.json'),'utf8'));
const bytes=await readFile(path.join(root,config.tiles));
const sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(bytes)!==manifest.sha256)throw new Error('Archive checksum mismatch');
const archive=new PMTiles({getKey:()=>config.tiles,getBytes:async(offset,length)=>{const b=bytes.subarray(offset,offset+length);return {data:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};}});
const xy=(lon,lat,z)=>{const n=2**z;return [Math.floor((lon+180)/360*n),Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n)];};
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s·、（）()\-—_.,，。:：/]/g,'');
const pattern=/家常蹄花|三样子|惠来味|嫩豆芽|菜篮子|菜蓝子|大堰|大玲|黔江鸡杂|荣昌鸡汤|jeju|set.?coffee|归井|喜大匠|甘怡|熊蜂|山梨树|呜嘟|哑巴兔|把把尖|43号/i;
const areaPattern=/福泉路|新南路|天邻|玖玺|劳动二村|环湖路|洋河二村|大坪正街|嘉华路|华新路/;
const unique=new Map(),counts={requestedTiles:0,presentTiles:0,poiFragments:0,uniquePOIs:0};
const z=15,[left,top]=xy(config.bounds[0],config.bounds[3],z),[right,bottom]=xy(config.bounds[2],config.bounds[1],z);
const contextMatches=[],buildingHouseNumbers=[];
for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
 counts.requestedTiles++;const tileBytes=await archive.getZxy(z,x,y);if(!tileBytes)continue;counts.presentTiles++;
 const tile=new VectorTile(new PbfReader(tileBytes.data));
 const pois=tile.layers.pois;
 if(pois)for(let i=0;i<pois.length;i++){
  counts.poiFragments++;const f=pois.feature(i),p=f.properties,g=f.toGeoJSON(x,y,z).geometry;
  const key=String(f.id??'')+'|'+String(p.name||p['name:zh-Hans']||'')+'|'+JSON.stringify(g);
  if(!unique.has(key))unique.set(key,{tileFeatureId:f.id??null,properties:p,geometry:g,layerExtent:pois.extent,sampleTile:[z,x,y]});
 }
 for(const layerName of ['places','buildings','roads']){
  const layer=tile.layers[layerName];if(!layer)continue;
  for(let i=0;i<layer.length;i++){
   const f=layer.feature(i),p=f.properties,all=Object.entries(p).filter(([k])=>/name|addr|ref/.test(k)).map(([,v])=>v).join(' ');
   if(areaPattern.test(all))contextMatches.push({layer:layerName,tileFeatureId:f.id??null,properties:p,geometry:f.toGeoJSON(x,y,z).geometry,tile:[z,x,y],referenceOnly:true});
   if(layerName==='buildings'&&['22','390','9','27','87','14','18','110'].includes(String(p.addr_housenumber)))buildingHouseNumbers.push({tileFeatureId:f.id??null,properties:p,geometry:f.toGeoJSON(x,y,z).geometry,tile:[z,x,y],missingStreetAssociation:true});
  }
 }
}
const inBounds=g=>g.type==='Point'&&g.coordinates[0]>=config.bounds[0]&&g.coordinates[0]<=config.bounds[2]&&g.coordinates[1]>=config.bounds[1]&&g.coordinates[1]<=config.bounds[3];
const all=[...unique.values()];counts.uniquePOIs=all.length;counts.displayPointsInsideConfiguredBounds=all.filter(r=>inBounds(r.geometry)).length;counts.displayPointsOutsideConfiguredBounds=all.filter(r=>!inBounds(r.geometry)).length;
const names=r=>Object.entries(r.properties).filter(([k])=>k.startsWith('name')||k.startsWith('pgf:name')).map(([,v])=>String(v));
const candidates=all.filter(r=>names(r).some(n=>pattern.test(n))).map(r=>({...r,matchingTargetIds:targets.filter(t=>names(r).some(n=>norm(n)===norm(t.name)||norm(n).includes(norm(t.name))||norm(t.name).includes(norm(n)))).map(t=>t.id),exactTargetIds:targets.filter(t=>names(r).some(n=>norm(n)===norm(t.name))).map(t=>t.id),inConfiguredCoverage:inBounds(r.geometry),rawOSMIdentityVerified:false,coordinateNature:'Vector-tile display geometry; quantized Web Mercator grid converted to lon/lat. Not original OSM node or entrance.'}));
const poiContext=all.filter(r=>names(r).some(n=>areaPattern.test(n))).map(r=>({...r,referenceOnly:true,inConfiguredCoverage:inBounds(r.geometry)}));
const unescape=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m=>[m[1],unescape(m[2])]));
const tags=s=>Object.fromEntries([...s.matchAll(/<tag\b([^>]+)\/>/g)].map(m=>{const a=attrs(m[1]);return [a.k,a.v];}));
const xmlReports=[];
for(const relative of ['../design/prototype-3d/data/osm-raw.xml','../output/research/osm-minzu-2026-10-25.xml']){
 const raw=await readFile(path.join(root,relative)),xml=raw.toString('utf8'),records=[];const ns=new Map();
 for(const m of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){const a=attrs(m[1]),t=tags(m[2]||''),point=[Number(a.lon),Number(a.lat)];ns.set(Number(a.id),point);records.push({type:'node',id:Number(a.id),point,tags:t});}
 for(const m of xml.matchAll(/<way\b([^>]*?)>([\s\S]*?)<\/way>/g)){const a=attrs(m[1]);records.push({type:'way',id:Number(a.id),tags:tags(m[2]),nodeIds:[...m[2].matchAll(/<nd ref="(\d+)"\/>/g)].map(m=>Number(m[1]))});}
 const matches=records.filter(r=>{const text=Object.entries(r.tags).filter(([k])=>/name|addr/.test(k)).map(([,v])=>v).join(' ');return pattern.test(text)||areaPattern.test(text);}).map(r=>({...r,geometry:r.type==='way'?{type:'LineString',coordinates:r.nodeIds.map(id=>ns.get(id))}:undefined,sourceURL:`https://www.openstreetmap.org/${r.type}/${r.id}`}));
 xmlReports.push({file:path.relative(path.resolve(root,'..'),path.join(root,relative)).replaceAll('\\','/'),sha256:sha(raw),records:records.length,matchedRecords:matches});
}
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'pois-z15.json'),JSON.stringify({counts,records:all},null,2)+'\n');
const report={date:'2026-10-27',source:{archive:config.tiles,sha256:sha(bytes),replicationTime:'2026-10-20T04:00:00Z',bounds:config.bounds,sourceZoom:z},targets,counts,candidates,poiContext,contextMatches,buildingHouseNumbers,xmlReports,limitations:['No online queries or new downloads.','POI tile feature IDs are not assumed to be OSM node IDs.','Tile coordinates are display coordinates, not original node positions or verified entrances.','A reference name, street, district or generic house number is not a restaurant match.']};
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const summary={date:report.date,scope:'Existing cache only; vector-tile label features are not shop entrances or original OSM nodes.',source:{...report.source,attribution:'© OpenStreetMap contributors / Protomaps',license:'ODbL 1.0'},targetCount:targets.length,counts,exactNameMatchCount:candidates.reduce((n,r)=>n+r.exactTargetIds.length,0),adoptedShopCoordinates:0,possibleNameMatches:candidates.map(r=>({name:r.properties.name,tileFeatureId:r.tileFeatureId,exactTargetIds:r.exactTargetIds,inConfiguredCoverage:r.inConfiguredCoverage,accepted:false})),referenceOnlyNames:poiContext.map(r=>({name:r.properties.name,inConfiguredCoverage:r.inConfiguredCoverage,acceptedAsShop:false})),xmlReports:xmlReports.map(r=>({file:r.file,sha256:r.sha256,matchedRecords:r.matchedRecords.length})),limitations:report.limitations};
await writeFile(path.join(root,'../output/research/video-poi-audit-20261027.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({counts,candidates,poiContext:poiContext.map(r=>({name:r.properties.name,id:r.tileFeatureId,geometry:r.geometry})),contextNames:[...new Set(contextMatches.map(r=>r.properties.name))],buildingHouseNumbers:buildingHouseNumbers.length,xmlMatches:xmlReports.map(r=>({file:r.file,matches:r.matchedRecords.map(m=>({type:m.type,id:m.id,name:m.tags.name,street:m.tags['addr:street'],number:m.tags['addr:housenumber']}))}))},null,2));
