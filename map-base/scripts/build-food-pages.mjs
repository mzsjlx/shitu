import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {validateVideoLibrary,localVideoAsset} from '../src/video-library-model.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(url,label)=>`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
const shell=(title,body,prefix='./')=>`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · 食途</title><style>
*{box-sizing:border-box}body{margin:0;color:#392f28;background:#f8f5ed;font:14px/1.7 system-ui,sans-serif}a{color:inherit;text-underline-offset:4px}header,main,footer{max-width:1180px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;gap:20px}header>a{font:600 28px SimSun,serif;text-decoration:none}nav{display:flex;gap:20px;align-items:center}h1,h2{font-family:SimSun,'Songti SC',serif;line-height:1.3}h1{font-size:42px;margin:14px 0}h2{font-size:23px;margin:10px 0 4px}.intro{max-width:650px;margin:10px 0 32px}small,.muted{color:#927b65}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.card{background:#fffaf3;padding:8px;border-radius:22px;overflow:hidden}.card>a{display:block;text-decoration:none}.card img{width:100%;height:180px;object-fit:cover;border-radius:16px}.card .copy{padding:0 10px 12px}.card p{font-size:12px;color:#927b65}.pending{height:180px;display:grid;place-items:center;background:#eae3d7;border-radius:16px}.detail{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(240px,1fr);gap:32px}.detail video,.detail img{display:block;width:100%;max-height:70vh;object-fit:contain;background:#27201d;border-radius:22px}.cta{display:inline-block;padding:10px 20px;background:#f66d4b;border-radius:20px;text-decoration:none;color:white}.source{margin-top:22px}footer{margin-top:36px;font-size:12px;color:#927b65;border-top:1px solid #e7dfd3}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail{grid-template-columns:1fr}h1{font-size:34px}}@media(max-width:420px){header,main,footer{padding:18px}.grid{gap:12px}.card img,.pending{height:140px}h2{font-size:19px}.card .copy{padding:0 4px 10px}nav{gap:12px;font-size:12px}}
</style></head><body><header><a href="${prefix}?view=food">食途<span style="color:#f66d4b">.</span></a><nav><a href="${prefix}?view=food">回地图</a><a href="${prefix}places.html">视频里的店</a></nav></header><main>${body}</main><footer>位置为旅行规划参考，分店与店门请出发前确认。地点参照 © OpenStreetMap contributors · ODbL。视频来自用户提供并确认授权的链接，保留原作者署名。</footer></body></html>`;

export async function buildFoodPages(root){
  const catalog=validateVideoLibrary(JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8')));
  const assets=JSON.parse(await readFile(path.join(root,'dist/data/video-library-assets.json'),'utf8')).segments;
  const rows=catalog.sources.flatMap(source=>source.segments.map(segment=>({source,segment,asset:assets[segment.id]})));
  const pages=new Map();
  const cards=rows.map(({source,segment:s,asset})=>`<article class="card"><a href="./places/video-${escape(s.id)}.html">${localVideoAsset(asset?.poster,'jpg')?`<img loading="lazy" src="${escape(asset.poster)}" alt="${escape(s.name)} · 原视频画面">`:'<div class="pending">本机封面待导入</div>'}<div class="copy"><small>${escape(s.category)}</small><h2>${escape(s.name)}</h2><small>来源：抖音 · ${escape(source.author)}</small><p>${escape(s.planningLocation?.label||s.addressText||'位置待补')} · 位置大致</p></div></a></article>`).join('');
  const intro=`<small>重庆 · 你分享的探店视频</small><h1>镜头里的店，<br>放到地图上。</h1><p class="intro">${rows.length} 个单店片段，来自 ${catalog.sources.filter(s=>s.segments.length).length} 位博主。图片取自对应视频，位置按地址与街区大致整理。</p><div class="grid">${cards}</div>`;
  pages.set('places.html',shell('视频里的门店',intro));
  pages.set('videos.html',shell('探店视频来源',`<small>仅整理你分享的链接</small><h1>跟着镜头，找到想吃的。</h1><p class="intro">${catalog.sources.map(source=>external(source.url,source.author)+(source.segments.length?'（'+source.segments.length+'段）':'（原片待补）')).join(' · ')}</p><a class="cta" href="./?view=food&amp;videos=1">打开站内视频库</a><br><br><div class="grid">${cards}</div>`));
  for(const {source,segment:s,asset}of rows){
    const poster=localVideoAsset(asset?.poster,'jpg'),clip=localVideoAsset(asset?.clip,'mp4');
    const media=clip?`<video controls playsinline preload="metadata" poster="../${escape(poster.slice(2))}" src="../${escape(clip.slice(2))}"></video>`:poster?`<img src="../${escape(poster.slice(2))}" alt="${escape(s.name)} · 原视频画面">`:'<div class="pending">视频素材待导入本机，可打开原视频。</div>';
    pages.set(`places/video-${s.id}.html`,shell(s.name,`<div class="detail"><div>${media}</div><article><small>${escape(s.category)} · 来源：抖音</small><h1>${escape(s.name)}</h1><p>${escape(s.summary)}</p><p>博主：${escape(source.author)}</p><p>${escape(s.addressText||s.planningLocation?.label||'原片未提供详细地址')}</p><small>位置大致 · ${escape(s.planningLocation?.note||'分店待确认')}</small><p><a class="cta" href="../?view=food&amp;place=video-${escape(s.id)}">在地图上看这家</a></p><div class="source">${external(source.url,'查看原视频与博主')}</div>${s.planningLocation?.anchor?`<p class="muted">街区位置参照：${external(s.planningLocation.anchor.url,s.planningLocation.anchor.name)}</p>`:''}</article></div>`,'../'));
  }
  const out=path.resolve(root,'dist'),folder=path.join(out,'places');await mkdir(folder,{recursive:true});
  for(const [file,html]of pages)await writeFile(path.join(out,file),html);
  for(const file of await readdir(folder,{withFileTypes:true})){
    if(!file.isFile()||!(/^(?:osm-node-\d+|video-[a-z0-9-]+)\.html$/.test(file.name))||pages.has('places/'+file.name))continue;
    const target=path.resolve(folder,file.name);if(!target.startsWith(folder+path.sep))throw new Error('Generated page cleanup escaped its folder');await unlink(target);
  }
  return pages.size;
}
