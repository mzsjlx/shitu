import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildVideoLibrary} from './build-video-library.mjs';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportOption=process.argv.indexOf('--report');
const reportName=reportOption>=0?process.argv[reportOption+1]:'VIDEO-LIBRARY-MEDIA-QA.json';
if(!/^[A-Za-z0-9_-]+\.json$/.test(reportName))throw new Error('Invalid report filename');
const catalog=JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8'));
const generated=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));
const checks=[],check=(name,passed)=>checks.push({name,passed});
const sizes=new Map();
for(const source of catalog.sources.filter(s=>s.segments.length)){
 const original=path.join(root,'.local/video-intake',source.id,'source.mp4');
 check(source.id+' source digest matches',digest(await readFile(original))===source.sourceSHA256);
 const result=spawnSync(process.env.FOODCITY_FFPROBE||'ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',original],{encoding:'utf8',windowsHide:true});
 if(result.status!==0)throw new Error('Cannot probe original video '+source.id+': '+(result.error?.message||result.stderr));
 sizes.set(source.id,JSON.parse(result.stdout).streams[0]);
}
for(const source of catalog.sources)for(const segment of source.segments){
 const record=generated.records.find(r=>r.id===segment.id),names=mediaNames(source,segment),folder=path.join(root,'.local/video-clips',source.id);
 const clip=await readFile(path.join(folder,names.clip)),poster=await readFile(path.join(folder,names.poster));
 check(segment.id+' matches approved range, media identity and frozen files',record.mediaKey===mediaKey(source,segment)&&record.sourceSHA256===source.sourceSHA256&&record.start===segment.start&&record.end===segment.end&&record.clipSHA256===digest(clip)&&record.posterSHA256===digest(poster));
 const originalSize=sizes.get(source.id);
 check(segment.id+' preserves source dimensions, audio/video and measured length',record.probe.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'&&s.width===originalSize.width&&s.height===originalSize.height)&&record.probe.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac')&&Math.abs(Number(record.probe.format.duration)-(segment.end-segment.start))<.16);
}
const isolated=path.join(root,'.local/video-library-empty-build');await mkdir(path.join(isolated,'data'),{recursive:true});await mkdir(path.join(isolated,'dist/data'),{recursive:true});for(const name of ['video-library.json','video-map-contexts.json'])await cp(path.join(root,'data',name),path.join(isolated,'data',name));await buildVideoLibrary(isolated);
const empty=JSON.parse(await readFile(path.join(isolated,'dist/data/video-library-assets.json'),'utf8'));
check('Build without original media completes with an empty availability manifest',Object.keys(empty.segments).length===0);
const foodHash=digest(await readFile(path.join(root,'data/food-records.json')));check('Retired example places are absent',JSON.parse(await readFile(path.join(root,'data/food-records.json'),'utf8')).records.length===0);
const standalone=await readFile(path.join(root,'preview.html'));
const report={date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),method:'Local source and clip SHA256 checks, prepared ffprobe streams, isolated no-media build. Frames/subtitles and source end cards were inspected; not geographic validation or full listening review.',catalogSHA256:digest(await readFile(path.join(root,'data/video-library.json'))),sources:catalog.sources.map(s=>({id:s.id,url:s.url,author:s.author,status:s.acquisitionStatus,sourceSHA256:s.sourceSHA256,segments:s.segments.length})),mediaUploadedByThisCheck:false,sourcePlaceSHA256:foodHash,clipCount:generated.records.length,totalClipBytes:generated.records.reduce((sum,r)=>sum+r.clipBytes,0),totalPosterBytes:generated.records.reduce((sum,r)=>sum+r.posterBytes,0),standalone:{bytes:standalone.length,sha256:digest(standalone)},records:generated.records,checks,passed:checks.every(c=>c.passed)};
await writeFile(path.join(root,reportName),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,checks:checks.length,clipCount:report.clipCount,bytes:report.totalClipBytes,standalone:report.standalone}));
