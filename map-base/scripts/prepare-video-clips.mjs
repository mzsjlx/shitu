import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=validateVideoLibrary(JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8')));
const ffmpeg=process.env.FOODCITY_FFMPEG||'ffmpeg',ffprobe=process.env.FOODCITY_FFPROBE||'ffprobe';
function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.once('error',reject);child.once('exit',code=>code===0?resolve(out):reject(new Error(`${command} exited ${code}: ${err.slice(-2500)}`)));});}
const option=process.argv.indexOf('--source'),sourceId=option>=0?process.argv[option+1]:null;
if(option>=0&&!data.sources.some(s=>s.id===sourceId))throw new Error('未找到这个来源ID');
// A separate ledger permits independent sources to be encoded concurrently.
// The caller merges these source-specific ledgers after all jobs have completed.
const reportOption=process.argv.indexOf('--report');
const reportPath=path.resolve(root,reportOption>=0?process.argv[reportOption+1]:'.local/video-clips/report.json');
if(!reportPath.startsWith(path.join(root,'.local/video-clips')+path.sep))throw new Error('剪辑记录必须保存在 .local/video-clips 内');
await mkdir(path.dirname(reportPath),{recursive:true});
let existing={records:[]};try{existing=JSON.parse(await readFile(reportPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const report={schemaVersion:1,preparedAt:new Date().toISOString(),catalogSHA256:digest(await readFile(path.join(root,'data/video-library.json'))),mediaUploaded:false,records:existing.records||[],missingSources:[]};
for(const source of data.sources.filter(source=>!sourceId||source.id===sourceId)){
  if(!source.segments.length)continue;
  const input=path.join(root,'.local/video-intake',source.id,'source.mp4');
  let bytes;try{bytes=await readFile(input);}catch(error){if(error.code==='ENOENT'){report.missingSources.push(source.id);continue;}throw error;}
  if(digest(bytes)!==source.sourceSHA256)throw new Error(`原片哈希不一致: ${source.id}`);
  const out=path.join(root,'.local/video-clips',source.id);await mkdir(out,{recursive:true});
  for(const segment of source.segments){
    const names=mediaNames(source,segment),clip=path.join(out,names.clip),poster=path.join(out,names.poster),temporary=clip+'.tmp.mp4';
    if(process.argv.includes('--resume')){
      const previous=report.records.find(r=>r.id===segment.id&&r.mediaKey===mediaKey(source,segment)&&r.sourceSHA256===source.sourceSHA256);
      if(previous){
        try{
          const [clipBytes,posterBytes]=await Promise.all([readFile(clip),readFile(poster)]);
          if(digest(clipBytes)===previous.clipSHA256&&digest(posterBytes)===previous.posterSHA256){console.log(`${segment.id}: verified existing clip, skipped`);continue;}
        }catch(error){if(error.code!=='ENOENT')throw error;}
      }
    }
    await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(segment.start),'-i',input,'-t',String(segment.end-segment.start),'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-threads','4','-c:a','aac','-b:a','128k','-map_metadata','-1','-movflags','+faststart',temporary]);
    await rename(temporary,clip);
    await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(segment.posterSecond),'-i',input,'-frames:v','1','-q:v','3',poster]);
    const probe=JSON.parse(await run(ffprobe,['-v','error','-show_entries','format=duration:stream=codec_name,codec_type,width,height,duration','-of','json',clip]));
    const duration=Number(probe.format.duration);
    if(!probe.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264')||!probe.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac')||Math.abs(duration-(segment.end-segment.start))>.16)throw new Error(`片段音画或长度校验失败: ${segment.id}`);
    const clipBytes=await readFile(clip),posterBytes=await readFile(poster);
    report.records=report.records.filter(record=>record.id!==segment.id);
    report.records.push({id:segment.id,sourceId:source.id,mediaKey:mediaKey(source,segment),sourceSHA256:source.sourceSHA256,start:segment.start,end:segment.end,posterSecond:segment.posterSecond,clip:names.clip,poster:names.poster,clipBytes:clipBytes.length,posterBytes:posterBytes.length,clipSHA256:digest(clipBytes),posterSHA256:digest(posterBytes),probe});
    console.log(`${segment.id}: ${duration.toFixed(3)}s, H.264 + AAC`);
    await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  }
}
console.log(`已处理 ${report.records.length} 个单店片段；缺少原片 ${report.missingSources.length} 份。`);
