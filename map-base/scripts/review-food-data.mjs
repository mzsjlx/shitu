import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const load=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const data=await load('../data/food-records.json');
const original=await load('../../design/prototype-3d/data/osm-raw.json');
const manifest=await load('../../design/prototype-3d/data/osm-source.json');
const xml=await readFile(new URL('../../design/prototype-3d/data/osm-raw.xml',import.meta.url));
assert.equal(createHash('sha256').update(xml).digest('hex'),manifest.sha256);
const nodes=new Map();
for(const match of xml.toString('utf8').matchAll(/<node\b([^>]*?)(?:\/>|>)/g)){
  const attrs=Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  nodes.set(Number(attrs.id),[Number(attrs.lon),Number(attrs.lat)]);
}
assert.equal(data.city,'chongqing');assert.equal(data.status,'local-content-candidates');
assert(data.imageDisclosure.includes('AI')&&data.imageDisclosure.includes('非任何门店实拍'));
const ids=new Set(),records=[];
for(const r of data.records){
  assert(!ids.has(r.id));ids.add(r.id);
  assert.equal(r.coordinateSystem,'WGS84');assert.equal(r.verificationStatus,'source-record');assert.equal(r.entranceStatus,'unverified');assert.equal(r.routeEligible,false);
  assert.equal(r.coordinateEvidence.kind,'osm-node');
  const node=original.elements.find(e=>e.type==='node'&&e.id===r.coordinateEvidence.id);assert(node);
  assert.deepEqual(r.coordinates,nodes.get(node.id));assert.deepEqual(r.coordinates,[node.lon,node.lat]);
  assert.equal(r.sourceName,node.tags.name);assert.equal(r.coordinateEvidence.url,'https://www.openstreetmap.org/node/'+node.id);
  assert.equal(r.coordinateEvidence.sourceDate,manifest.retrievedAt.slice(0,10));
  if(r.coordinateEvidence.sourceCheckDate)assert.equal(r.coordinateEvidence.sourceCheckDate,node.tags.check_date);
  for(const video of r.videos){assert.equal(video.branchMatch,'unconfirmed');assert.equal(video.playbackStatus,'not-tested');assert.equal(new URL(video.url).protocol,'https:');}
  records.push({id:r.id,sourceNode:node.id,coordinatesMatchOriginalXML:true,sourceNamePreserved:true,routeEligible:r.routeEligible,videoLinks:r.videos.length});
}
assert.equal(data.records.length,2);
assert.equal(data.records.flatMap(r=>r.videos).length,2);
const relatedVideos=data.records.flatMap(r=>r.videos);
assert(relatedVideos.some(video=>video.url==='https://www.bilibili.com/video/BV1wC4y1x7Wc/'));
const newerVideo=relatedVideos.find(video=>video.url==='https://www.bilibili.com/list/3546942135077690?bvid=BV1AJ7S6sE8y&oid=116701391753474');
assert(newerVideo);assert.equal(newerVideo.author,'杉田千紘_CHIICHAN');assert.equal(newerVideo.chapterText,'0:40');assert.equal(newerVideo.chapterSeconds,40);assert.equal(newerVideo.observedOn,'2026-10-25');
const sprite=await readFile(new URL('../../design/concepts/food-thumbnails-v2.jpg',import.meta.url));
const report={verifiedOn:'2026-10-25',scope:'Source-record consistency only; not business, entrance, current address, video playback or photo authenticity verification. New creator metadata also checked separately against frozen original-page HTML.',sourceXMLSHA256:manifest.sha256,records,image:{origin:'Existing image_gen concept illustration, not merchant photography',sha256:createHash('sha256').update(sprite).digest('hex')},passed:true};
await writeFile(new URL('../FOOD-DATA-20261025-VERIFICATION.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
