import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {loadCityCatalog} from './city-catalogs.mjs';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cityOption=process.argv.indexOf('--city'),cityId=cityOption>=0?process.argv[cityOption+1]:null;
const context=await loadCityCatalog(root,cityId||'chongqing');
const postersPath=path.join(root,context.cityId==='chongqing'?'data/video-posters.json':`data/cities/${context.cityId}/video-posters.json`);
const catalog=context.catalog;
const report=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));
let previous={schemaVersion:1,segments:{}};
try{previous=JSON.parse(await readFile(postersPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
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
await mkdir(path.dirname(postersPath),{recursive:true});
await writeFile(postersPath,JSON.stringify(manifest,null,2)+'\n');
if(context.cityId!=='chongqing'){
  const globalPath=path.join(root,'data/video-posters.json');
  try{
    const global=JSON.parse(await readFile(globalPath,'utf8'));
    Object.assign(global.segments,manifest.segments);
    await writeFile(globalPath,JSON.stringify(global,null,2)+'\n');
  }catch{}
}
console.log('仓库封面：'+Object.keys(manifest.segments).length+' 张；原片和剪辑仍在 .local/。');
