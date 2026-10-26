import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const validText=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const validId=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(value);
function sourceURL(value){
  if(typeof value!=='string'||value.length>2048)return null;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
function chapterSeconds(value){
  if(typeof value!=='string'||!/^\d{1,4}:\d{2}(?::\d{2})?$/.test(value))return null;
  const parts=value.split(':').map(Number);
  if(parts.at(-1)>59||(parts.length===3&&parts[1]>59))return null;
  return parts.reduce((total,part)=>total*60+part,0);
}
const external=(url,label,className='')=>`<a${className?` class="${escape(className)}"`:''} href="${escape(sourceURL(url))}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const date=value=>`<time datetime="${escape(value)}">${escape(value)}</time>`;
const numbered=value=>String(value).padStart(2,'0');

function validate(data,food){
  if(data?.schemaVersion!==1||data.city!=='chongqing'||!validDate(data.preparedOn)||!Array.isArray(data.guides)||data.guides.length<1||data.guides.length>30)throw new Error('视频资料页需要有效的重庆作者资料与整理日期');
  if(food?.city!=='chongqing'||!Array.isArray(food.records))throw new Error('视频资料页无法读取重庆地图候选资料');
  const records=new Map();
  for(const record of food.records){
    if(typeof record?.id!=='string'||records.has(record.id))throw new Error('地图候选资料的来源ID缺失或重复');
    records.set(record.id,record);
  }
  const guideIds=new Set(),restaurantIds=new Set(),anchorIds=new Set(['main','library-title','reading-note-title']);
  for(const guide of data.guides){
    if(!validId(guide?.id)||guideIds.has(guide.id)||anchorIds.has(guide.id)||anchorIds.has(`${guide.id}-title`))throw new Error('视频资料页需要唯一且安全的作者记录ID');
    guideIds.add(guide.id);
    anchorIds.add(guide.id);anchorIds.add(`${guide.id}-title`);
    if(!validText(guide.title,600)||!validText(guide.author,100)||!sourceURL(guide.url)||typeof guide.videoId!=='string'||!/^BV[a-zA-Z0-9]{10}$/.test(guide.videoId))throw new Error('作者记录缺少完整标题、作者、视频ID或安全的HTTPS原页');
    if(!validDate(guide.publishedOn)||!validDate(guide.observedOn)||guide.publishedOn>guide.observedOn||guide.observedOn>data.preparedOn)throw new Error('作者记录需要有效且先后顺序正确的发布、读取与整理日期');
    if(guide.playbackStatus!=='not-tested')throw new Error('视频播放状态已改变，请先重审原页观看与播放说明');
    if(!Array.isArray(guide.restaurants)||guide.restaurants.length<1||guide.restaurants.length>100)throw new Error('作者记录缺少可读的门店章节');
    for(const restaurant of guide.restaurants){
      if(!validId(restaurant?.id)||restaurantIds.has(restaurant.id)||anchorIds.has(restaurant.id))throw new Error('视频资料页需要唯一且安全的门店章节ID');
      restaurantIds.add(restaurant.id);
      anchorIds.add(restaurant.id);
      if(!validText(restaurant.name,120)||!validText(restaurant.addressText,300)||!validText(restaurant.category,40))throw new Error('门店章节缺少完整店名、作者地址或类别');
      if(!Number.isInteger(restaurant.chapterSeconds)||restaurant.chapterSeconds<0||restaurant.chapterSeconds>86400||chapterSeconds(restaurant.chapterText)!==restaurant.chapterSeconds)throw new Error('门店章节需要一致的时间标注与有效秒数');
      if(restaurant.relatedCandidateId!==undefined&&restaurant.relatedCandidateId!==null){
        const record=records.get(restaurant.relatedCandidateId);
        if(typeof restaurant.relatedCandidateId!=='string'||!record||record.name!==restaurant.name||record.verificationStatus!=='source-record'||record.entranceStatus!=='unverified'||record.routeEligible!==false)throw new Error('相关地图候选必须同名、存在且仍为入口待核的来源记录');
      }
    }
  }
}

function restaurantRow(restaurant,index){
  const candidate=restaurant.relatedCandidateId;
  const connection=candidate?`<a class="candidate-link" href="./?view=food&amp;place=${escape(encodeURIComponent(candidate))}">查看相关地图候选 <span aria-hidden="true">↗</span></a><span class="candidate-note">分店对应仍待核</span>`:'<span class="pending-location">地图位置待补</span>';
  return `<li class="restaurant-row" id="${escape(restaurant.id)}">
    <span class="restaurant-number" aria-hidden="true">${numbered(index+1)}</span>
    <div class="restaurant-name"><h3>${escape(restaurant.name)}</h3><span class="category">${escape(restaurant.category)}</span></div>
    <div class="restaurant-address"><span class="field-label">作者简介地址</span><p>${escape(restaurant.addressText)}</p></div>
    <div class="restaurant-detail"><span class="chapter"><span>章节</span> ${escape(restaurant.chapterText)}</span><div class="map-connection">${connection}</div></div>
  </li>`;
}

function guideArticle(guide,index){
  return `<article class="creator-guide" id="${escape(guide.id)}" aria-labelledby="${escape(guide.id)}-title">
    <header class="guide-heading">
      <div class="guide-kicker"><span class="eyebrow">${numbered(index+1)} / 原作者记录</span><span class="guide-count">${guide.restaurants.length} 家店 · ${escape(guide.author)}</span></div>
      <div class="guide-source"><div class="source-copy"><span class="field-label">原视频完整标题</span><h2 id="${escape(guide.id)}-title">${escape(guide.title)}</h2><p class="source-meta"><span>作者 <strong>${escape(guide.author)}</strong></span><span>发布 ${date(guide.publishedOn)}</span><span>原页文字读取 ${date(guide.observedOn)}</span></p></div><div class="source-action">${external(guide.url,'去B站看原视频','video-cta')}<span>在原平台打开 · 新窗口</span></div></div>
    </header>
    <div class="restaurant-list-heading"><h3>镜头里的店，逐家记下。</h3><span>店名、地址与章节均据作者简介整理</span></div>
    <ol class="restaurant-list">${guide.restaurants.map(restaurantRow).join('')}</ol>
    <p class="chapter-note"><span aria-hidden="true">↳</span> 章节是作者简介中的时间标注；原链接打开视频原页，尚未验证播放或站内嵌入。</p>
  </article>`;
}

function render(data){
  const hasRelatedMap=data.guides.some(guide=>guide.restaurants.some(restaurant=>restaurant.relatedCandidateId));
  const restaurantCount=data.guides.reduce((total,guide)=>total+guide.restaurants.length,0);
  const sources=data.guides.map(guide=>external(guide.url,`${guide.author} · 原视频与简介`)).join('<span class="source-separator" aria-hidden="true">/</span>');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f7f3eb">
  <title>重庆探店视频 · 食途</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="./creator-guides.css">
</head>
<body>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header"><a class="brand" href="./?view=food" aria-label="回到食途重庆美食地图">食途<span aria-hidden="true">·</span></a><span class="header-caption">重庆 / 探店视频</span><nav aria-label="主导航"><a class="directory-link" href="./places.html">资料目录</a><a class="header-map" href="./?view=food">回地图 <span aria-hidden="true">↗</span></a></nav></header>
  <main id="main">
    <section class="library-hero" aria-labelledby="library-title"><div class="hero-copy"><span class="eyebrow">重庆 · 跟着原作者找店</span><h1 id="library-title">沿着镜头，<br>发现重庆。</h1><p class="hero-description">先读作者留下的店名、地址与章节，<br class="desktop-break">再回地图留住想去。</p><div class="hero-index"><span><strong>${numbered(data.guides.length)}</strong> 份作者记录</span><span><strong>${numbered(restaurantCount)}</strong> 条门店线索</span><span class="index-city">CHONGQING <i aria-hidden="true">↗</i></span></div></div><figure class="hero-figure"><div class="hero-image" role="img" aria-label="AI生成的通用重庆小面菜品示意，非视频门店或实际菜品实拍"></div><figcaption>AI菜品示意 · 非门店实拍</figcaption><span class="image-corner" aria-hidden="true">一城烟火，循味而行。</span></figure></section>
    ${data.guides.map(guideArticle).join('')}
    <aside class="reading-note" aria-labelledby="reading-note-title"><div><span class="eyebrow">给下一次出发，留一点余地</span><h2 id="reading-note-title">从一条线索，走向一座城。</h2></div><div><p>这里保留原作者的店名、简介地址与章节，方便边读边记。地图候选的分店对应仍待核；出发前请再确认店址与营业情况。</p><p class="date-note">页面整理于 ${date(data.preparedOn)}。发布、原页文字读取与页面整理日期分别记录资料时间，不代表近期到店。</p><a class="quiet-link" href="./?view=food">回地图，留住想去的一站 <span aria-hidden="true">↗</span></a></div></aside>
  </main>
  <footer class="site-footer"><div class="footer-top"><a class="footer-brand" href="./?view=food">食途<span aria-hidden="true">·</span></a><span>把想吃的一口，留在想去的一站。</span><a href="./places.html">继续读地点资料 <span aria-hidden="true">↗</span></a></div><div class="footer-sources"><span>本页原始来源</span><div>${sources}</div>${hasRelatedMap?`<p>${external('https://www.openstreetmap.org/copyright','相关地图候选 © OpenStreetMap contributors · ODbL')}</p>`:''}</div></footer>
</body>
</html>
`;
}

export async function buildCreatorGuides(root){
  const [dataText,foodText,css]=await Promise.all([readFile(path.join(root,'data/creator-guides.json'),'utf8'),readFile(path.join(root,'data/food-records.json'),'utf8'),readFile(path.join(root,'src/creator-guides.css'),'utf8')]);
  const data=JSON.parse(dataText),food=JSON.parse(foodText);
  validate(data,food);
  // All source checks and rendering complete before any existing output is touched.
  const html=render(data),out=path.resolve(root,'dist');
  await mkdir(out,{recursive:true});
  await writeFile(path.join(out,'creator-guides.css'),css);
  await writeFile(path.join(out,'videos.html'),html);
  return ['videos.html'];
}
