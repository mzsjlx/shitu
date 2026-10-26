import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const load=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const source=await load('../../design/prototype-3d/data/osm-source.json'),raw=await load('../../design/prototype-3d/data/osm-raw.json');
const xml=await readFile(new URL('../../design/prototype-3d/data/osm-raw.xml',import.meta.url));
assert.equal(createHash('sha256').update(xml).digest('hex'),source.sha256);
const points=new Map();
for(const m of xml.toString('utf8').matchAll(/<node\b([^>]*?)(?:\/>|>)/g)){
  const a=Object.fromEntries([...m[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));points.set(Number(a.id),[Number(a.lon),Number(a.lat)]);
}
const ways=raw.elements.filter(e=>e.type==='way'&&e.tags?.highway).map(e=>({id:e.id,nodes:e.nodes,tags:e.tags}));
const used=new Set(ways.flatMap(w=>w.nodes)),tagged=new Map(raw.elements.filter(e=>e.type==='node').map(e=>[e.id,e.tags||{}]));
const nodes=[...used].map(id=>{assert(points.has(id),'Missing original node '+id);return [id,...points.get(id),tagged.get(id)||{}];});
const restrictions=raw.elements.filter(e=>e.type==='relation'&&(e.tags?.['restriction:foot']||(e.tags?.type==='restriction'&&e.tags?.['restriction:conditional']&&!e.tags?.except?.split(';').includes('foot'))));
const data={schemaVersion:1,city:'chongqing',source:{date:source.retrievedAt.slice(0,10),xmlSHA256:source.sha256,attribution:source.attribution,license:source.license},bounds:[106.566,29.558,106.584,29.573],nodes,ways,excludedFootRestrictionWays:[...new Set(restrictions.flatMap(r=>r.members.filter(m=>m.type==='way').map(m=>m.ref)))],sample:{title:'朝千路 → 解放东路',endpoints:[{nodeID:4592547287,label:'朝千路道路点'},{nodeID:13912494389,label:'解放东路道路点'}],status:'road-topology-trial',entrancesConnected:false},limitations:['道路节点之间的二维长度，不含到店门口的连接。','普通道路缺少步行许可或人行道资料；连通不等于已核实可走。','当前仅用地面道路，未处理现场封路、立交和完整无障碍条件。']};
await writeFile(new URL('../data/walk-network.json',import.meta.url),JSON.stringify(data)+'\n');
console.log(JSON.stringify({nodes:nodes.length,ways:ways.length,sourceHashVerified:true,bytes:Buffer.byteLength(JSON.stringify(data))+1}));
