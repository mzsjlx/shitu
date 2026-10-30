import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PMTiles} from 'pmtiles';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';

const root=new URL('../',import.meta.url);
const json=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes instanceof ArrayBuffer?new Uint8Array(bytes):bytes).digest('hex');
const config=await json('config/cities.json'),city=config.cities.chongqing;
const bytes=await readFile(new URL(city.tiles,root)),manifest=await json(city.dataFiles.manifest);
const archiveOf=(raw,key)=>new PMTiles({getKey:()=>key,getBytes:async(offset,length)=>{
  const b=raw.subarray(offset,offset+length);return {data:b.buffer.slice(b.byteOffset,b.byteOffset+b.length)};
}});
const archive=archiveOf(bytes,'batch3-expanded-map');
async function baselineFile(file){
  try{return await readFile(new URL('.local/batch3-map/before/'+file.replaceAll('/','--'),root));}
  catch(error){if(error.code!=='ENOENT')throw error;return execFileSync('git',['show','1676742:map-base/'+file],{cwd:fileURLToPath(root),maxBuffer:32*1024*1024,windowsHide:true});}
}
const xy=(point,z=15)=>[Math.floor((point[0]+180)/360*2**z),Math.floor((1-Math.asinh(Math.tan(point[1]*Math.PI/180))/Math.PI)/2*2**z)];
const checks=[];
async function check(name,fn){try{const details=await fn();checks.push({name,passed:true,...(details?{details}:{})});}catch(error){checks.push({name,passed:false,error:error.message});}}

await check('Expanded archive, configuration and actual bytes have matching provenance',()=>{
  assert.deepEqual(city.bounds,[106.36,29.48,106.65,29.87]);
  assert.deepEqual(manifest.bbox,city.bounds);assert.equal(manifest.bytes,bytes.length);assert.equal(manifest.sha256,sha(bytes));
  assert.equal(manifest.source,'https://build.protomaps.com/20261027.pmtiles');
  return {bounds:city.bounds,bytes:bytes.length,sha256:sha(bytes)};
});
await check('Every requested z15 map tile exists in the expanded coverage',async()=>{
  const [left,top]=xy([city.bounds[0],city.bounds[3]]),[right,bottom]=xy([city.bounds[2],city.bounds[1]]);let tiles=0;
  for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++){assert(await archive.getZxy(15,x,y),`Missing tile ${x}/${y}`);tiles++;}
  return {tiles};
});
await check('All prior central-city z15 tiles are preserved byte for byte',async()=>{
  const baseline=await baselineFile('data/chongqing.pmtiles');
  const old=archiveOf(baseline,'batch3-prior-map'),[left,top]=xy([106.43,29.65]),[right,bottom]=xy([106.65,29.48]);let tiles=0;
  for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++){
    const a=await old.getZxy(15,x,y),b=await archive.getZxy(15,x,y);assert(a&&b);assert.equal(sha(a.data),sha(b.data));tiles++;
  }
  return {priorTiles:tiles};
});
for(const [name,point] of [['北碚老城',[106.4339,29.8282]],['北碚辽宁路片区',[106.4303,29.8238]],['北碚西南大学片区',[106.4265,29.8158]]])await check(name+' contains retained road and building features',async()=>{
  const [x,y]=xy(point),raw=await archive.getZxy(15,x,y);assert(raw);
  const tile=new VectorTile(new PbfReader(raw.data));assert(tile.layers.roads?.length>0);assert(tile.layers.buildings?.length>0);
  return {point,tile:[15,x,y],roads:tile.layers.roads.length,buildings:tile.layers.buildings.length};
});
await check('Terrain coverage includes every requested northern tile and preserves existing tiles',async()=>{
  const terrain=await json(city.dataFiles.terrainManifest),byId=new Map(terrain.tiles.map(t=>[[t.z,t.x,t.y].join('/'),t]));
  const prior=JSON.parse(await baselineFile('data/terrain-manifest.json'));
  for(const t of prior.tiles)assert.equal(byId.get([t.z,t.x,t.y].join('/'))?.sha256,t.sha256);
  let verified=0;
  for(let z=city.demMinZoom;z<=city.demMaxZoom;z++){
    const [left,top]=xy([city.bounds[0],city.bounds[3]],z),[right,bottom]=xy([city.bounds[2],city.bounds[1]],z);
    for(let x=left-1;x<=right+1;x++)for(let y=top-1;y<=bottom+1;y++){
      const t=byId.get([z,x,y].join('/'));assert(t);
      const raw=await readFile(new URL(city.demTiles.replace('{z}',z).replace('{x}',x).replace('{y}',y),root));
      assert.equal(sha(raw),t.sha256);verified++;
    }
  }
  return {verifiedTiles:verified,preservedTiles:prior.tiles.length};
});
await check('Northern roads are included in searchable actual road geometry',async()=>{
  const data=await json(city.dataFiles.index),roads=Array.isArray(data)?data:data.roads;
  const names=['天生路','辽宁路','南京路','碚峡路'];
  for(const name of names)assert(roads.some(r=>r.name===name&&r.center[1]>29.7),`Missing northern road ${name}`);
  return {roads:roads.length,names};
});
await check('Expanded walking network and its manifest use the same coverage and frozen source',async()=>{
  const raw=await readFile(new URL(city.foodContent.roadNetwork,root)),network=JSON.parse(raw),m=await json('data/food-road-network-manifest.json');
  assert.deepEqual(network.bounds,city.bounds);assert.deepEqual(m.bounds,city.bounds);assert.equal(m.networkSHA256,sha(raw));
  assert.equal(m.bytes,raw.length);assert.equal(network.source.sha256,'ea1bd60ca0a71231f6ec62bb5ff270594e56559c88d483e25c7e60bcc6fd20ba');
  assert(network.nodes.some(n=>n[2]>29.8));assert.equal(network.nodes.length,m.nodes);assert.equal(network.ways.length,m.ways);
  return {nodes:m.nodes,ways:m.ways,bytes:m.bytes};
});
const report={verifiedOn:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),scope:'Retained map/terrain/search/topology coverage to Beibei, prior map preservation; not shop entrance or live-access verification.',checks,passed:checks.every(c=>c.passed)};
await writeFile(new URL('VIDEO-BATCH3-MAP-QA.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
