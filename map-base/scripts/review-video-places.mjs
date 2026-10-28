import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {groupVideoPlaces} from '../src/video-places.js';
import {PMTiles} from 'pmtiles';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
const data=validateVideoLibrary(JSON.parse(await readFile(new URL('../data/video-library.json',import.meta.url),'utf8')));
const batch=JSON.parse(await readFile(new URL('../data/video-intake-batch-20261028.json',import.meta.url),'utf8'));
const config=JSON.parse(await readFile(new URL('../config/cities.json',import.meta.url),'utf8'));
const archiveBytes=await readFile(new URL('../data/chongqing.pmtiles',import.meta.url));
const archive=new PMTiles({getKey:()=> 'batch2-retained-local-map',getBytes:async(offset,length)=>{const b=archiveBytes.subarray(offset,offset+length);return {data:b.buffer.slice(b.byteOffset,b.byteOffset+b.length)};}});
const shapingba=data.sources.find(s=>s.id==='manbei').segments[0].coordinates,z=15,n=2**z,x=Math.floor((shapingba[0]+180)/360*n),y=Math.floor((1-Math.asinh(Math.tan(shapingba[1]*Math.PI/180))/Math.PI)/2*n);
const tileBytes=await archive.getZxy(z,x,y),tile=tileBytes?new VectorTile(new PbfReader(tileBytes.data)):null;
const groups=groupVideoPlaces(data),checks=[];
const check=(name,fn)=>{try{fn();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}};
check('All eight supplied source URLs and authorization records are preserved',()=>{
 assert.equal(batch.sources.length,8);
 for(const source of batch.sources){const live=data.sources.find(s=>s.id===source.id);assert.equal(live.url,source.url);assert.equal(live.sourceSHA256,source.sourceSHA256);assert.equal(live.rights.status,'user-confirmed');assert.equal(live.rights.confirmedOn,'2026-10-28');}
});
for(const duplicate of batch.deduplication)check(duplicate.placeId+' keeps both creators at a single stop',()=>{
 const group=groups.filter(g=>g.id==='video-'+duplicate.placeId);assert.equal(group.length,1);assert.deepEqual(group[0].clips.map(c=>c.segment.id).sort(),[...duplicate.segmentIds].sort());assert.equal(new Set(group[0].clips.map(c=>c.source.author)).size,2);
});
for(const failure of ['missing-place','different-name','different-position','chained-merge'])check('Reject mistaken shop merge: '+failure,()=>{
 const bad=structuredClone(data),rows=bad.sources.flatMap(s=>s.segments),s=rows.find(s=>s.id==='bailong-gangzi');
 if(failure==='missing-place')s.placeId='nonexistent';
 if(failure==='different-name')s.name='Another shop';
 if(failure==='different-position')s.coordinates[0]+=.01;
 if(failure==='chained-merge')rows.find(s=>s.id==='tiedan-gangzi').placeId='bailong-gangzi';
 assert.throws(()=>validateVideoLibrary(bad));
});
check('Unidentified venues retain clips and stay unlocated',()=>{
 const pending=batch.sources.flatMap(s=>s.segments).filter(s=>s.locationStatus==='needs-location');assert.equal(pending.length,5);
 for(const s of pending){const live=data.sources.flatMap(s=>s.segments).find(t=>t.id===s.id);assert.equal(live.coordinates,null);assert.equal(live.routeEligible,false);assert(live.addressNote.includes('线索'));}
});
check('Old footage has its original publication date and operating-status note',()=>{
 for(const id of ['zhangxixi','manbei']){const source=data.sources.find(s=>s.id===id);assert(source.publishedOn.startsWith(id==='zhangxixi'?'2021':'2024'));assert(source.segments.every(s=>s.footageNote.includes('营业情况待确认')));}
});
check('Located clips have independent open-map anchors and coverage',()=>{
 const b=config.cities.chongqing.bounds;
 for(const s of data.sources.flatMap(s=>s.segments).filter(s=>s.coordinates)){assert(s.planningLocation.anchor.url.startsWith('https://www.openstreetmap.org/'));assert.equal(s.coordinateSystem,'WGS84');assert(s.coordinates[0]>=b[0]&&s.coordinates[0]<=b[2]&&s.coordinates[1]>=b[1]&&s.coordinates[1]<=b[3]);}
});
check('New Shapingba area contains actual retained road and building features',()=>{assert(shapingba[0]<106.47);assert(tile?.layers.roads?.length>0);assert(tile?.layers.buildings?.length>0);});
const report={date:'2026-10-28',scope:'Catalog integrity, same-store grouping, mistaken-merge rejection, independent approximate anchors and original publication dates; not entrance or current-business verification.',sources:data.sources.length,clips:data.sources.flatMap(s=>s.segments).length,distinctEntries:groups.length,mapPlaces:groups.filter(g=>g.primary.segment.coordinates).length,checks,passed:checks.every(c=>c.passed)};
await writeFile(new URL('../VIDEO-BATCH2-DATA-QA.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
