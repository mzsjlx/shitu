import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';
import {validateVideoMapContexts} from '../src/video-map-context-model.js';
export async function buildVideoLibrary(root){
  const data=validateVideoLibrary(JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8')));
  validateVideoMapContexts(JSON.parse(await readFile(path.join(root,'data/video-map-contexts.json'),'utf8')),data);
  let report;try{report=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const assets={schemaVersion:1,catalogSHA256:digest(await readFile(path.join(root,'data/video-library.json'))),segments:{}};
  for(const source of data.sources)for(const segment of source.segments){
    const names=mediaNames(source,segment),record=report?.records?.find(r=>r.id===segment.id&&r.mediaKey===mediaKey(source,segment)&&r.sourceSHA256===source.sourceSHA256);
    if(!record)continue;
    const folder=path.join(root,'.local/video-clips',source.id),clip=path.join(folder,names.clip),poster=path.join(folder,names.poster);
    let clipBytes,posterBytes;try{[clipBytes,posterBytes]=await Promise.all([readFile(clip),readFile(poster)]);}catch(error){if(error.code==='ENOENT')continue;throw error;}
    if(digest(clipBytes)!==record.clipSHA256||digest(posterBytes)!==record.posterSHA256)throw new Error('视频素材校验不一致: '+segment.id);
    const out=path.join(root,'dist/media/videos',source.id);await mkdir(out,{recursive:true});
    await Promise.all([cp(clip,path.join(out,names.clip)),cp(poster,path.join(out,names.poster))]);
    assets.segments[segment.id]={clip:`./media/videos/${source.id}/${names.clip}`,poster:`./media/videos/${source.id}/${names.poster}`,durationSeconds:Number(record.probe.format.duration)};
  }
  await writeFile(path.join(root,'dist/data/video-library-assets.json'),JSON.stringify(assets,null,2)+'\n');
  console.log('Local video library: '+Object.keys(assets.segments).length+' clips copied; missing media falls back to original links.');
}
