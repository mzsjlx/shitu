import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cityOption=process.argv.indexOf('--city');
const city=cityOption>=0?process.argv[cityOption+1]:'chongqing';
const catalogOption=process.argv.indexOf('--catalog');
const catalogRel=catalogOption>=0?process.argv[catalogOption+1]:(city==='chongqing'?'data/video-library.json':`data/cities/${city}/video-library.json`);
const catalogFile=path.resolve(root,catalogRel);
const catalog=validateVideoLibrary(JSON.parse(await readFile(catalogFile,'utf8')),city);
const report=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));
let previous={schemaVersion:1,segments:{}};
try{previous=JSON.parse(await readFile(path.join(root,'data/video-posters.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const manifest={schemaVersion:1,segments:{...previous.segments}};
for(const source of catalog.sources)for(const segment of source.segments){
  const key=mediaKey(source,segment),names=mediaNames(source,segment);
  const record=report.records.find(r=>r.id===segment.id&&r.mediaKey===key&&r.sourceSHA256===source.sourceSHA256);
  if(!record){const existing=previous.segments?.[segment.id];if(existing?.mediaKey===key)manifest.segments[segment.id]=existing;continue;}
  const from=path.join(root,'.local/video-clips',source.id,names.poster),bytes=await readFile(from);
  if(digest(bytes)!==record.posterSHA256)throw new Error('封面校验失败：'+segment.id);
  const relative=`assets/video-posters/${source.id}/${names.poster}`,target=path.join(root,relative);
  await mkdir(path.dirname(target),{recursive:true});await cp(from,target);
  manifest.segments[segment.id]={sourceId:source.id,sourceSHA256:source.sourceSHA256,mediaKey:key,path:relative,sha256:record.posterSHA256,bytes:bytes.length};
}
await writeFile(path.join(root,'data/video-posters.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('仓库封面：'+Object.keys(manifest.segments).length+' 张；原片和剪辑仍在 .local/。');
