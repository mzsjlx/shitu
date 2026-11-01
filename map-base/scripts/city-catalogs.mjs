import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {validateVideoLibrary} from '../src/video-library-model.js';
async function configAt(project){
  try{return JSON.parse(await readFile(path.join(project,'config/cities.json'),'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;return {cities:{chongqing:{name:'重庆',foodContent:{videoLibrary:'data/video-library.json'}}}};}
}

export async function loadCityCatalog(project,cityId='chongqing'){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(cityId))throw new Error('城市编号无效');
  const config=await configAt(project);
  const city=config.cities[cityId];if(!city)throw new Error('城市尚未配置：'+cityId);
  const relative=city.foodContent?.videoLibrary;if(!relative)throw new Error('城市没有视频目录：'+cityId);
  const bytes=await readFile(path.join(project,relative));
  return {cityId,city,relative,bytes,catalog:validateVideoLibrary(JSON.parse(bytes),cityId)};
}
export async function allCityCatalogs(project){
  const config=await configAt(project);
  const result=[];for(const [id,city] of Object.entries(config.cities))if(city.foodContent?.videoLibrary)result.push(await loadCityCatalog(project,id));
  const ids=new Set();for(const {catalog} of result)for(const source of catalog.sources){
    for(const id of [source.id,...source.segments.map(s=>s.id)]){if(ids.has(id))throw new Error('跨城市来源或片段编号重复：'+id);ids.add(id);}
  }
  return result;
}
export async function sourceCatalog(project,sourceId,cityId){
  const catalogs=cityId?[await loadCityCatalog(project,cityId)]:await allCityCatalogs(project);
  const matches=catalogs.filter(c=>c.catalog.sources.some(s=>s.id===sourceId));
  if(matches.length!==1)throw new Error('未找到唯一的素材来源：'+sourceId);
  return {...matches[0],source:matches[0].catalog.sources.find(s=>s.id===sourceId)};
}
