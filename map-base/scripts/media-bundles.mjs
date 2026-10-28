import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJSON=async file=>JSON.parse(await readFile(file,'utf8'));
const catalogAt=async project=>validateVideoLibrary(await readJSON(path.join(project,'data/video-library.json')));
const safeRelative=value=>typeof value==='string'&&/^(?:video-intake|video-clips)\/[a-z][a-z0-9-]*\/[a-z][a-z0-9.-]*\.(?:mp4|jpg)$/.test(value)&&!value.includes('..');
async function availableReport(project){try{return await readJSON(path.join(project,'.local/video-clips/report.json'));}catch(error){if(error.code==='ENOENT')return {schemaVersion:1,records:[]};throw error;}}

export async function packSource(project,sourceId){
  const catalog=await catalogAt(project),source=catalog.sources.find(s=>s.id===sourceId);
  if(!source?.segments.length)throw new Error('这个来源还没有已剪片段：'+sourceId);
  const report=await availableReport(project),entries={},files=[],records=[];
  const add=async(relative,expected)=>{const bytes=await readFile(path.join(project,'.local',relative));if(digest(bytes)!==expected)throw new Error('素材哈希不符：'+relative);entries[relative]=new Uint8Array(bytes);files.push({path:relative,bytes:bytes.length,sha256:expected});};
  await add(`video-intake/${source.id}/source.mp4`,source.sourceSHA256);
  for(const segment of source.segments){
    const record=report.records.find(r=>r.id===segment.id&&r.mediaKey===mediaKey(source,segment)&&r.sourceSHA256===source.sourceSHA256);
    if(!record)throw new Error('缺少对应剪辑记录：'+segment.id);
    const names=mediaNames(source,segment);await add(`video-clips/${source.id}/${names.clip}`,record.clipSHA256);await add(`video-clips/${source.id}/${names.poster}`,record.posterSHA256);records.push(record);
  }
  const manifest={schemaVersion:1,kind:'shitu-media-bundle',source:{id:source.id,url:source.url,author:source.author,sourceSHA256:source.sourceSHA256},files,records};
  const fingerprint=digest(JSON.stringify(manifest)).slice(0,16);entries['bundle.json']=strToU8(JSON.stringify(manifest,null,2)+'\n');
  const folder=path.join(project,'.local/media-bundles');await mkdir(folder,{recursive:true});
  const name=`shitu-media-${source.id}-${fingerprint}.zip`,target=path.join(folder,name),archive=zipSync(entries,{level:0});await writeFile(target,archive);
  const summary={sourceId:source.id,name,bytes:archive.length,sha256:digest(archive),clips:records.length};await writeFile(target+'.json',JSON.stringify(summary,null,2)+'\n');return {...summary,path:target};
}

export async function importBundle(project,archivePath){
  const info=await stat(archivePath);if(info.size>1024*1024*1024)throw new Error('素材包超过 1 GiB，请按视频来源分别打包。');
  const archive=await readFile(archivePath);
  let published;try{published=await readJSON(path.join(project,'data/media-bundles.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const known=published?.sources?.find(s=>s.name===path.basename(archivePath));
  if(known&&(known.bytes!==archive.length||known.sha256!==digest(archive)))throw new Error('下载的素材包与仓库校验摘要不一致，请重新下载。');
  let total=0;
  const entries=unzipSync(archive,{filter:file=>{total+=file.originalSize;if(total>1500*1024*1024||(!safeRelative(file.name)&&file.name!=='bundle.json'))throw new Error('素材包含异常路径或体积。');return true;}});
  if(!entries['bundle.json']||entries['bundle.json'].length>2*1024*1024)throw new Error('缺少有效的素材包清单。');
  const bundle=JSON.parse(strFromU8(entries['bundle.json'])),catalog=await catalogAt(project);
  const source=catalog.sources.find(s=>s.id===bundle.source?.id);
  if(bundle.schemaVersion!==1||bundle.kind!=='shitu-media-bundle'||!source||source.url!==bundle.source.url||source.sourceSHA256!==bundle.source.sourceSHA256||!Array.isArray(bundle.files)||!Array.isArray(bundle.records))throw new Error('素材包与当前视频目录不对应，请先同步相应代码分支。');
  const expected=new Map([[`video-intake/${source.id}/source.mp4`,source.sourceSHA256]]),accepted=[];
  for(const segment of source.segments){
    const record=bundle.records.find(r=>r.id===segment.id&&r.sourceId===source.id&&r.mediaKey===mediaKey(source,segment)&&r.sourceSHA256===source.sourceSHA256);
    if(!record)throw new Error('素材包缺少匹配的剪辑记录：'+segment.id);
    const names=mediaNames(source,segment);expected.set(`video-clips/${source.id}/${names.clip}`,record.clipSHA256);expected.set(`video-clips/${source.id}/${names.poster}`,record.posterSHA256);accepted.push(record);
  }
  if(bundle.files.length!==expected.size||Object.keys(entries).length!==expected.size+1||new Set(bundle.files.map(f=>f.path)).size!==expected.size)throw new Error('素材文件列表不完整或含多余文件。');
  const writes=[];
  // Validate every member and every existing destination before writing any file.
  for(const file of bundle.files){
    if(!safeRelative(file.path)||!expected.has(file.path)||file.sha256!==expected.get(file.path)||!entries[file.path]||entries[file.path].length!==file.bytes||digest(entries[file.path])!==file.sha256)throw new Error('素材包文件校验失败：'+file.path);
    const target=path.resolve(project,'.local',file.path),base=path.resolve(project,'.local');if(!target.startsWith(base+path.sep))throw new Error('素材路径超出项目目录。');
    try{if(digest(await readFile(target))!==file.sha256)throw new Error('本机已有不同内容，未覆盖：'+file.path);}catch(error){if(error.code!=='ENOENT')throw error;writes.push({target,bytes:entries[file.path]});}
  }
  const report=await availableReport(project);for(const incoming of accepted){const existing=report.records.find(r=>r.id===incoming.id);if(existing&&(existing.mediaKey!==incoming.mediaKey||existing.clipSHA256!==incoming.clipSHA256||existing.posterSHA256!==incoming.posterSHA256))throw new Error('本机剪辑记录冲突，未覆盖：'+incoming.id);}
  for(const file of writes){await mkdir(path.dirname(file.target),{recursive:true});await writeFile(file.target,file.bytes);}
  report.records=report.records.filter(r=>!accepted.some(a=>a.id===r.id)).concat(accepted);report.catalogSHA256=digest(await readFile(path.join(project,'data/video-library.json')));report.importedAt=new Date().toISOString();
  await mkdir(path.join(project,'.local/video-clips'),{recursive:true});await writeFile(path.join(project,'.local/video-clips/report.json'),JSON.stringify(report,null,2)+'\n');
  return {sourceId:source.id,clips:accepted.length,newFiles:writes.length};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,...args]=process.argv.slice(2);
  if(command==='pack'){const option=args.indexOf('--source'),sources=option>=0?[args[option+1]]:(await catalogAt(root)).sources.filter(s=>s.segments.length).map(s=>s.id);for(const id of sources)console.log(JSON.stringify(await packSource(root,id)));}
  else if(command==='import'){if(!args.length)throw new Error('请提供下载的 ZIP 文件路径。');for(const file of args)console.log(JSON.stringify(await importBundle(root,path.resolve(file))));console.log('导入完成。运行 npm run build，然后刷新地图。');}
  else throw new Error('用法：npm run media:pack -- --source 来源ID；npm run media:import -- 素材包.zip');
}
