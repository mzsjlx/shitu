import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {prepareStreetView} from '../src/street-geometry.js';
const load=async relative=>JSON.parse(await readFile(new URL(relative,import.meta.url),'utf8'));
const collection=await load('../data/street-detail.geojson');
const manifest=await load('../data/street-detail-manifest.json');
const original=await load('../../design/prototype-3d/data/osm-raw.json');
const xml=await readFile(new URL('../../design/prototype-3d/data/osm-raw.xml',import.meta.url));
assert.equal(createHash('sha256').update(xml).digest('hex'),manifest.source.cacheXMLSHA256);
const nodes=new Map();
for(const match of xml.toString('utf8').matchAll(/<node\b([^>]*?)(?:\/>|>)/g)){
  const attrs=Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  nodes.set(Number(attrs.id),[Number(attrs.lon),Number(attrs.lat)]);
}
const ways=new Map(original.elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
let points=0;
const ids=new Set();
for(const feature of collection.features){
  const p=feature.properties,way=ways.get(p.osmId);
  assert(way,'No original OSM way for '+p.osmId);
  assert(!ids.has(p.osmId),'Duplicate OSM way');ids.add(p.osmId);
  assert.deepEqual(JSON.parse(p.rawTags),way.tags);
  assert.deepEqual(p.nodeIds,way.nodes);
  assert.equal(feature.geometry.coordinates.length,way.nodes.length);
  feature.geometry.coordinates.forEach((point,i)=>{assert.deepEqual(point,nodes.get(way.nodes[i]));points++;});
  if(p.explicitlyZebra)assert(way.tags['crossing:markings']==='zebra'||way.tags.crossing_ref==='zebra');
}
const prepared=prepareStreetView(collection);
const visible=prepared.data.features.filter(f=>f.properties.type!=='lane-separator');
for(const {properties:p} of visible){
  assert(!p.restricted&&!p.isElevated&&!p.isUnderground&&p.layer===0);
  assert(!['yes','true','1'].includes(p.indoor)&&p.area!=='yes'&&p.highway!=='corridor');
}
for(const feature of prepared.data.features.filter(f=>f.properties.type==='lane-separator')){
  const source=visible.find(f=>f.properties.osmId===feature.properties.osmId);
  assert(source?.properties.illustrated&&source.properties.lanes>=2);
  assert(['yes','1','true','-1'].includes(source.properties.oneway));
  assert.equal(feature.properties.illustration,true);
}
const report={verifiedOn:'2026-10-22',sourceHashVerified:true,uniqueWays:ids.size,coordinatesCheckedAgainstOriginalXML:points,sourceTagsPreserved:true,originalNodeOrderPreserved:true,unmarkedCrossingsNotPromotedToZebra:true,visibleSourceFeatures:visible.length,...prepared.stats,passed:true};
await writeFile(new URL('../STREET-DATA-VERIFICATION.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
