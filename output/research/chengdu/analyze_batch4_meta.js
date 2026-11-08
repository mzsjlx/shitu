const fs = require('fs');
const path = require('path');

const ids = [
  'cd-bozai-7286785550986611983',
  'cd-mizijun-7496389147616218379',
  'cd-yangdui-7618146716805614874',
  'cd-shashayouchanle-7694250186420137125',
  'cd-xiehuangbao-7670453083968785664',
  'cd-rourou-7024754924965661956',
  'cd-yizhihedapang-7661852443047369078',
  'cd-renyi-7514320630787919167',
  'cd-yangdui-7683090587154779401',
  'cd-wangxun-7609124019572428095',
  'cd-wulala-7078883833852087566',
  'cd-xiaozhang-7640394328993233657'
];

ids.forEach((id, idx) => {
  const p = path.join('output/research/chengdu/details', id + '.json');
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const author = d.author ? d.author.nickname : '';
  const desc = d.desc || '';
  const poi = d.poi_info ? d.poi_info.poi_name : '';
  const poiAddress = d.poi_info ? (d.poi_info.address || (d.poi_info.share_info && d.poi_info.share_info.share_desc)) : '';
  const poiCity = d.poi_info ? d.poi_info.city : '';
  const duration = (d.video && d.video.duration ? d.video.duration / 1000 : 0);
  const createTime = d.create_time ? new Date(d.create_time * 1000).toISOString().split('T')[0] : '';
  console.log(`[${idx+1}] ID: ${id}`);
  console.log(`    Author: ${author} (${createTime})`);
  console.log(`    Title: ${desc}`);
  console.log(`    POI: ${poi} | City: ${poiCity} | Addr: ${poiAddress}`);
  console.log(`    Duration: ${duration}s`);
  console.log('---');
});
