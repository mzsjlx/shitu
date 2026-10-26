import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),cache=new URL('../../output/research/',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('chiichan-2026-10-25.metadata.json',cache),'utf8'));
const html=await readFile(new URL(metadata.htmlFile,cache));
assert.equal(createHash('sha256').update(html).digest('hex'),metadata.sha256);
const source=metadata.extraction;
const specs={
  '超级李板凳面':{id:'li-bandeng',category:'小面',relatedCandidateId:'osm-node-13649952401'},
  '老甘家小龙虾江湖菜':{id:'laoganjia',category:'小龙虾',relatedCandidateId:null},
  '林中乐辣子鸡':{id:'linzhongle',category:'辣子鸡',relatedCandidateId:null},
  '抄姐老火锅':{id:'chaojie',category:'火锅',relatedCandidateId:null},
  '轻松空间･虾蟹馆专注十年':{id:'qingsong-kongjian',category:'虾蟹',relatedCandidateId:null},
  '牛莫王串串王':{id:'niumowang',category:'串串',relatedCandidateId:null}
};
assert.equal(source.restaurants.length,Object.keys(specs).length);
const restaurants=source.restaurants.map(place=>{
  assert(specs[place.name],'Unknown original restaurant name');
  return {...specs[place.name],name:place.name,addressText:place.addressText,chapterText:place.chapterText.split(' ')[0],chapterSeconds:place.chapterSeconds};
}).sort((a,b)=>a.chapterSeconds-b.chapterSeconds);
const guide={id:'chiichan-chongqing-20260606',title:source.title,author:source.owner.name,publishedOn:source.publishedAt.slice(0,10),observedOn:metadata.observedDate,url:metadata.requestedUrl,videoId:source.videoId,playbackStatus:'not-tested',restaurants};
await writeFile(new URL('data/creator-guides.json',root),JSON.stringify({schemaVersion:1,city:'chongqing',preparedOn:'2026-10-25',guides:[guide]},null,2)+'\n');
const foods=JSON.parse(await readFile(new URL('data/food-records.json',root),'utf8')),noodles=foods.records.find(record=>record.id==='osm-node-13649952401');
assert(noodles&&noodles.verificationStatus==='source-record'&&noodles.routeEligible===false);
const newVideo={title:source.title,author:source.owner.name,publishedOn:guide.publishedOn,observedOn:guide.observedOn,url:guide.url,chapterText:'0:40',chapterSeconds:40,branchMatch:'unconfirmed',playbackStatus:'not-tested'};
noodles.videos=[newVideo,...noodles.videos.filter(video=>video.url!==newVideo.url)];
for(const evidence of noodles.addressEvidence||[])if(evidence.url===guide.url)evidence.observedOn=guide.observedOn;
foods.reviewedOn='2026-10-25';
await writeFile(new URL('data/food-records.json',root),JSON.stringify(foods,null,2)+'\n');
const editorial=JSON.parse(await readFile(new URL('data/place-editorial.json',root),'utf8'));
editorial.preparedOn='2026-10-25';
editorial.places[noodles.id].directoryIntro='已有朝千路41号的作者文字线索，可读2026年与2020年相关原页。';
editorial.places[noodles.id].videoIntro='2026年杉田千紘_CHIICHAN的原作者简介把0:40标为超级李板凳面；另保留2020年馋大叔的历史相关链接。时间点来自作者文字，尚未核对视频画面、当前分店或播放能力。原链接打开平台原页。';
await writeFile(new URL('data/place-editorial.json',root),JSON.stringify(editorial,null,2)+'\n');
console.log(JSON.stringify({guides:1,restaurantClues:restaurants.length,mapCandidates:foods.records.length,noodlesVideoLinks:noodles.videos.length,sourceHTMLSHA256:metadata.sha256}));
