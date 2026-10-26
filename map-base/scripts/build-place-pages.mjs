import {cp,mkdir,readFile,readdir,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';

const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function sourceURL(value){
  if(typeof value!=='string')return null;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
const external=(url,label,className='')=>{
  const safe=sourceURL(url);return safe?`<a${className?` class="${escape(className)}"`:''} href="${escape(safe)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`:'';
};
const pageLink=record=>`./${encodeURIComponent(record.id)}.html`;
const mapLink=(record,prefix='../')=>`${prefix}?view=food${record?'&place='+encodeURIComponent(record.id):''}`;
function shell({title,description,prefix,body}){
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f7f3eb">
  <meta name="description" content="${escape(description)}">
  <title>${escape(title)} · 食途</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="${prefix}place-pages.css">
</head>
<body>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header"><a class="brand" href="${escape(mapLink(null,prefix))}" aria-label="回到食途重庆美食地图">食途<span aria-hidden="true">·</span></a><span class="header-caption">重庆 / 美食地点</span><a class="header-map" href="${escape(mapLink(null,prefix))}">去地图逛逛 <span aria-hidden="true">↗</span></a></header>
  ${body}
  <footer class="site-footer"><a class="footer-brand" href="${escape(mapLink(null,prefix))}">食途</a><span>把想吃的一口，留在想去的一站。</span><a href="${prefix}videos.html">探店视频资料 ↗</a><span>${external('https://www.openstreetmap.org/copyright','地点资料 © OpenStreetMap contributors · ODbL')}</span></footer>
</body>
</html>
`;
}
function photo(record,{prefix,extraClass='',caption=true}){
  const index=Number.isInteger(record.spriteIndex)&&record.spriteIndex>=0&&record.spriteIndex<3?record.spriteIndex:0;
  return `<figure class="food-figure ${escape(extraClass)}"><div class="food-photo sprite-${index}" style="background-image:url('${prefix}assets/food-concepts.jpg')" role="img" aria-label="${escape(record.category)}的AI通用菜品示意，非这家店的实拍"></div>${caption?'<figcaption>AI菜品示意 · 非门店实拍</figcaption>':''}</figure>`;
}
function card(record,note){
  return `<article class="place-card"><a class="place-card-link" href="./places/${encodeURIComponent(record.id)}.html">${photo(record,{prefix:'./'})}<div class="place-card-copy"><span class="eyebrow">${escape(record.category)}<span class="small-state">店址待核</span></span><h2>${escape(record.name)} <span aria-hidden="true">↗</span></h2><p>${escape(note.directoryIntro)}</p><span class="read-link">读这条地点资料</span></div></a></article>`;
}
function directory(records,editorial){
  const intro=records.length===2&&records.some(record=>record.category==='小面')&&records.some(record=>record.category==='火锅')?'从小面和火锅的两条候选线索开始。':`从当前整理的${records.length}条候选线索开始。`;
  const body=`<main id="main" class="directory-page">
  <section class="directory-intro"><span class="eyebrow">重庆 · 美食地点</span><h1>先留住想吃的<br>这一站。</h1><div class="directory-intro-side"><p>${escape(intro)}看看地点资料、读原作者页面，再回到地图安排想去的顺序。</p><a class="quiet-link" href="./?view=food">在三维地图上探索 <span aria-hidden="true">↗</span></a></div></section>
  <section class="places-grid" aria-label="当前门店资料">${records.map(record=>card(record,editorial.places[record.id])).join('')}</section>
  <section class="directory-note"><h2>同一座城，不同的资料完整度。</h2><p>当前这些地点均为店址待核的候选线索。各页分别列出可读的来源、资料日期与待确认事项。图片为通用菜品示意，具体菜品以门店实际信息为准。</p><span class="date-note">页面整理于 <time datetime="${escape(editorial.preparedOn)}">${escape(editorial.preparedOn)}</time></span></section>
</main>`;
  return shell({title:'重庆 · 美食地点',description:'食途重庆首批美食地点资料：查看候选门店的地点线索、原始来源与待确认事项，再回三维地图安排想去顺序。',prefix:'./',body});
}
function detail(record,records,editorial){
  const note=editorial.places[record.id],others=records.filter(item=>item.id!==record.id),videos=Array.isArray(record.videos)?record.videos.filter(video=>sourceURL(video?.url)):[];
  const addressEvidence=Array.isArray(record.addressEvidence)?record.addressEvidence.filter(evidence=>sourceURL(evidence?.url)):[];
  const source=record.coordinateEvidence||{};
  const videoSection=videos.length?`<section class="reading-section" aria-labelledby="video-title"><span class="section-number">02</span><div><span class="eyebrow">相关视频 · 分店待核</span><h2 id="video-title">原作者的相关探店内容。</h2><p>${escape(note.videoIntro)}</p><ul class="video-list">${videos.map(video=>`<li>${external(video.url,video.title,'video-link')}<span>${escape(video.author)} · <time datetime="${escape(video.publishedOn)}">${escape(video.publishedOn)}</time>${video.chapterText?' · 作者标注 '+escape(video.chapterText):''} · 原平台观看</span></li>`).join('')}</ul></div></section>`:'';
  const sourceRows=[{label:'开放地图原始地点记录',url:source.url,detail:`原记录名：${record.sourceName} · 地点缓存 ${source.sourceDate}`}];
  for(const evidence of addressEvidence)sourceRows.push({label:`${note.addressAuthor||'原作者'}的文字地址线索`,url:evidence.url,detail:`资料发布 ${evidence.publishedOn} · 原页文字读取 ${evidence.observedOn||editorial.authorPagesReadOn}；仅作文字地址线索，入口及分店对应仍待核`});
  for(const video of videos)sourceRows.push({label:`${video.author} · 相关探店原页`,url:video.url,detail:`资料发布 ${video.publishedOn} · 原页文字读取 ${video.observedOn||editorial.authorPagesReadOn}；未验证播放或分店对应`});
  const body=`<main id="main" class="detail-page">
  <nav class="breadcrumbs" aria-label="当前位置"><a href="../places.html">重庆 · 美食地点</a><span aria-hidden="true">/</span><span>${escape(record.name)}</span></nav>
  <article>
    <section class="place-hero"><div class="hero-copy"><span class="eyebrow">${escape(note.eyebrow)}<span class="small-state">店址待核</span></span><h1>${escape(record.name)}</h1><p class="hero-subtitle">${escape(note.subtitle)}</p><p class="hero-intro">${escape(note.intro)}</p><a class="map-cta" href="${escape(mapLink(record))}">去地图看这一站 <span aria-hidden="true">↗</span></a><span class="hero-caption">来源地点尚不等于实际门口</span></div>${photo(record,{prefix:'../',extraClass:'hero-photo'})}</section>
    <div class="article-grid"><div class="article-body">
      <section class="reading-section"><span class="section-number">01</span><div><span class="eyebrow">已有的地点线索</span><h2>${escape(note.addressHeading)}</h2>${note.addressParagraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</div></section>
      ${videoSection}
      <section class="reading-section"><span class="section-number">${videos.length?'03':'02'}</span><div><span class="eyebrow">放进想去之前</span><h2>${escape(note.beforeHeading)}</h2><p>${escape(note.beforeParagraph)}</p><a class="quiet-link" href="${escape(mapLink(record))}">回地图查看与收藏 <span aria-hidden="true">↗</span></a></div></section>
    </div><aside class="source-aside" aria-labelledby="sources-title"><span class="eyebrow">每条线索，都留有出处</span><h2 id="sources-title">来源与日期</h2><ol class="sources">${sourceRows.filter(row=>sourceURL(row.url)).map(row=>`<li>${external(row.url,row.label)}<p>${escape(row.detail)}</p></li>`).join('')}</ol><p class="source-note">页面整理于 <time datetime="${escape(editorial.preparedOn)}">${escape(editorial.preparedOn)}</time>，整理日期仅记录本页编辑时间。地点缓存与作者原页的读取日期见上方；具体分店、门口与当前营业情况仍待确认。</p></aside></div>
  </article>
  <nav class="other-places" aria-label="继续阅读"><span class="eyebrow">再看一条地点线索</span>${others.map(other=>`<a href="${pageLink(other)}"><span>${escape(other.category)} · 店址待核</span><strong>${escape(other.name)}</strong><i aria-hidden="true">↗</i></a>`).join('')}<a class="all-places" href="../places.html">查看全部地点资料 <span aria-hidden="true">↗</span></a></nav>
</main>`;
  return shell({title:`${record.name}｜地点线索与探店来源`,description:`食途整理${record.name}的现有地点线索、${videos.length?'历史原作者视频与':'原始来源与'}待确认事项。店址仍待核实，图片为菜品示意，可回重庆地图安排想去顺序。`,prefix:'../',body});
}

export async function buildPlacePages(root){
  const data=JSON.parse(await readFile(path.join(root,'data/food-records.json'),'utf8'));
  const editorial=JSON.parse(await readFile(path.join(root,'data/place-editorial.json'),'utf8'));
  if(data.city!=='chongqing'||!Array.isArray(data.records)||!data.records.length||editorial.schemaVersion!==1)throw new Error('门店资料页的来源或整理说明不完整');
  const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  if(!date(editorial.preparedOn)||!date(editorial.authorPagesReadOn))throw new Error('门店资料页需要明确有效的整理与原页读取日期');
  const ids=new Set();
  for(const record of data.records){
    if(typeof record.id!=='string'||!/^osm-node-[1-9]\d{0,19}$/.test(record.id)||ids.has(record.id)||!editorial.places?.[record.id])throw new Error('门店资料页需要唯一来源ID与独立整理说明');
    if(record.verificationStatus!=='source-record'||record.entranceStatus!=='unverified'||record.routeEligible!==false)throw new Error('候选资料页的来源状态已改变，请先重审页面文案');
    if(![record.name,record.sourceName,record.category].every(value=>typeof value==='string'&&value.trim()))throw new Error('门店资料页缺少地点名称或类别');
    if(!Number.isInteger(record.spriteIndex)||record.spriteIndex<0||record.spriteIndex>2)throw new Error('门店资料页缺少可用的菜品示意图编号');
    if(!sourceURL(record.coordinateEvidence?.url)||!date(record.coordinateEvidence?.sourceDate))throw new Error('门店资料页缺少有效的地点来源与缓存日期');
    const note=editorial.places[record.id];
    const fields=['eyebrow','subtitle','directoryIntro','intro','addressHeading','beforeHeading','beforeParagraph'];
    if(!fields.every(field=>typeof note[field]==='string'&&note[field].trim())||!Array.isArray(note.addressParagraphs)||!note.addressParagraphs.length||!note.addressParagraphs.every(value=>typeof value==='string'&&value.trim()))throw new Error('门店资料页的独立整理文案不完整');
    if(Array.isArray(record.videos)&&record.videos.some(video=>sourceURL(video?.url))&&(typeof note.videoIntro!=='string'||!note.videoIntro.trim()))throw new Error('相关视频缺少用途与对应情况说明');
    ids.add(record.id);
  }
  // Render all content before touching existing output, so validation errors cannot leave half a catalog.
  const pages=new Map([['places.html',directory(data.records,editorial)],...data.records.map(record=>[`places/${record.id}.html`,detail(record,data.records,editorial)])]);
  const out=path.resolve(root,'dist'),places=path.join(out,'places');await mkdir(places,{recursive:true});
  await cp(path.join(root,'src/place-pages.css'),path.join(out,'place-pages.css'));
  for(const [file,html]of pages)await writeFile(path.join(out,file),html);
  // Only this generator's strictly named HTML outputs are eligible for stale-page cleanup.
  for(const file of await readdir(places,{withFileTypes:true})){
    if(!file.isFile()||!/^osm-node-[1-9]\d{0,19}\.html$/.test(file.name)||pages.has('places/'+file.name))continue;
    const target=path.resolve(places,file.name);if(!target.startsWith(places+path.sep))throw new Error('资料页清理路径超出专用目录');
    await unlink(target);
  }
  return [...pages.keys()];
}
