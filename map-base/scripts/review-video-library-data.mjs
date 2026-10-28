import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildVideoLibrary} from './build-video-library.mjs';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8'));
const generated=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));
const checks=[],check=(name,passed)=>checks.push({name,passed});
for(const source of catalog.sources.filter(s=>s.segments.length))check(source.id+' source digest matches',digest(await readFile(path.join(root,'.local/video-intake',source.id,'source.mp4')))===source.sourceSHA256);
for(const source of catalog.sources)for(const segment of source.segments){
 const record=generated.records.find(r=>r.id===segment.id),names=mediaNames(source,segment),folder=path.join(root,'.local/video-clips',source.id);
 const clip=await readFile(path.join(folder,names.clip)),poster=await readFile(path.join(folder,names.poster));
 check(segment.id+' matches approved range, media identity and frozen files',record.mediaKey===mediaKey(source,segment)&&record.sourceSHA256===source.sourceSHA256&&record.start===segment.start&&record.end===segment.end&&record.clipSHA256===digest(clip)&&record.posterSHA256===digest(poster));
 check(segment.id+' has valid audio/video and measured length',record.probe.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'&&s.width===576&&s.height===1024)&&record.probe.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac')&&Math.abs(Number(record.probe.format.duration)-(segment.end-segment.start))<.16);
}
const isolated=path.join(root,'.local/video-library-empty-build');await mkdir(path.join(isolated,'data'),{recursive:true});await mkdir(path.join(isolated,'dist/data'),{recursive:true});for(const name of ['video-library.json','video-map-contexts.json'])await cp(path.join(root,'data',name),path.join(isolated,'data',name));await buildVideoLibrary(isolated);
const empty=JSON.parse(await readFile(path.join(isolated,'dist/data/video-library-assets.json'),'utf8'));
check('Build without original media completes with an empty availability manifest',Object.keys(empty.segments).length===0);
const foodHash=digest(await readFile(path.join(root,'data/food-records.json')));check('Retired example places are absent',JSON.parse(await readFile(path.join(root,'data/food-records.json'),'utf8')).records.length===0);
const standalone=await readFile(path.join(root,'preview.html'));
const report={date:'2026-10-28',method:'Local source and clip SHA256 checks, prepared ffprobe streams, isolated no-media build. Frames/subtitles and source end cards were inspected; not geographic validation or full listening review.',catalogSHA256:digest(await readFile(path.join(root,'data/video-library.json'))),sources:catalog.sources.map(s=>({id:s.id,url:s.url,author:s.author,status:s.acquisitionStatus,sourceSHA256:s.sourceSHA256,segments:s.segments.length})),originalMediaUploaded:false,sourcePlaceSHA256:foodHash,clipCount:generated.records.length,totalClipBytes:generated.records.reduce((sum,r)=>sum+r.clipBytes,0),totalPosterBytes:generated.records.reduce((sum,r)=>sum+r.posterBytes,0),standalone:{bytes:standalone.length,sha256:digest(standalone)},records:generated.records,checks,passed:checks.every(c=>c.passed)};
await writeFile(path.join(root,'VIDEO-LIBRARY-MEDIA-QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,checks:checks.length,clipCount:report.clipCount,bytes:report.totalClipBytes,standalone:report.standalone}));
