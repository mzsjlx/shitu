import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';
import {validateVideoMapContexts} from '../src/video-map-context-model.js';

export async function buildVideoLibrary(root){
  const citiesConfig=JSON.parse(await readFile(path.join(root,'config/cities.json'),'utf8'));
  let report;try{report=JSON.parse(await readFile(path.join(root,'.local/video-clips/report.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const assets={schemaVersion:1,segments:{}};
  for(const [cityId,city] of Object.entries(citiesConfig.cities)){
    const catalogRel=city.foodContent?.videoLibrary||(cityId==='chongqing'?'data/video-library.json':`data/cities/${cityId}/video-library.json`);
    const catalogPath=path.join(root,catalogRel);
    let data;
    try{
      data=validateVideoLibrary(JSON.parse(await readFile(catalogPath,'utf8')),cityId);
    }catch(e){
      if(e.code==='ENOENT')continue;
      throw e;
    }
    const contextsRel=(cityId==='chongqing')?'data/video-map-contexts.json':`data/cities/${cityId}/video-map-contexts.json`;
    try{
      const contextsData=JSON.parse(await readFile(path.join(root,contextsRel),'utf8'));
      validateVideoMapContexts(contextsData,data,city.bounds,cityId);
    }catch(e){
      if(e.code!=='ENOENT')throw e;
    }
    let posters;
    const postersRel=(cityId==='chongqing')?'data/video-posters.json':`data/cities/${cityId}/video-posters.json`;
    try{
      posters=JSON.parse(await readFile(path.join(root,postersRel),'utf8'));
    }catch(error){
      if(error.code!=='ENOENT')throw error;
      try{posters=JSON.parse(await readFile(path.join(root,'data/video-posters.json'),'utf8'));}catch{}
    }
    for(const source of data.sources)for(const segment of source.segments){
      const names=mediaNames(source,segment),key=mediaKey(source,segment),publicPoster=posters?.segments?.[segment.id];
      if(publicPoster?.mediaKey===key&&publicPoster.sourceSHA256===source.sourceSHA256){
        const expected=`assets/video-posters/${source.id}/${names.poster}`;
        if(publicPoster.path!==expected)throw new Error('封面路径不正确：'+segment.id);
        const bytes=await readFile(path.join(root,expected));
        if(digest(bytes)!==publicPoster.sha256)throw new Error('仓库封面校验失败：'+segment.id);
        const out=path.join(root,'dist',expected);await mkdir(path.dirname(out),{recursive:true});await cp(path.join(root,expected),out);
        assets.segments[segment.id]={poster:'./'+expected,durationSeconds:segment.end-segment.start};
      }
      const record=report?.records?.find(r=>r.id===segment.id&&r.mediaKey===key&&r.sourceSHA256===source.sourceSHA256);
      if(!record)continue;
      const folder=path.join(root,'.local/video-clips',source.id),clip=path.join(folder,names.clip),poster=path.join(folder,names.poster);
      let clipBytes,posterBytes;try{[clipBytes,posterBytes]=await Promise.all([readFile(clip),readFile(poster)]);}catch(error){if(error.code==='ENOENT')continue;throw error;}
      if(digest(clipBytes)!==record.clipSHA256||digest(posterBytes)!==record.posterSHA256)throw new Error('视频素材校验不一致: '+segment.id);
      const out=path.join(root,'dist/media/videos',source.id);await mkdir(out,{recursive:true});
      await Promise.all([cp(clip,path.join(out,names.clip)),cp(poster,path.join(out,names.poster))]);
      assets.segments[segment.id]={clip:`./media/videos/${source.id}/${names.clip}`,poster:`./media/videos/${source.id}/${names.poster}`,durationSeconds:Number(record.probe.format.duration)};
    }
  }
  await writeFile(path.join(root,'dist/data/video-library-assets.json'),JSON.stringify(assets,null,2)+'\n');
  console.log('Video library: '+Object.values(assets.segments).filter(s=>s.clip).length+' local clips, '+Object.values(assets.segments).filter(s=>s.poster).length+' posters.');
}
