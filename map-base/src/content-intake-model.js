import {sourceURL} from './content-review-model.js';

const MAX_TEXT=12000,MAX_LINES=40;
const requireText=(value,label,max)=>{
  if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error(label+'需要填写，且不超过'+max+'字。');
  return value.trim();
};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(new Date(value+'T00:00:00Z').getTime())&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const hasTimecode=text=>/(?:^|[^\d:：])(?:\d{1,3}[:：][0-5]\d[:：][0-5]\d|\d{1,3}[:：][0-5]\d)(?![\d:：])/.test(text);
const hasAddress=text=>/(?:地址|店址|门牌|位置|地点)\s*[:：]|[\p{Script=Han}A-Za-z\d]{1,40}(?:大道|路|街|巷|道|弄)\s*[\d一二三四五六七八九十百零〇附之\-－]+\s*[号號]/u.test(text);

// These are literal text clues. Neither line proximity nor a name match establishes a branch.
export function analyzeDescription(text,catalog){
  requireText(text,'简介文字',MAX_TEXT);
  const candidates=catalog.candidates||[],lines=[];
  for(const [index,raw]of text.replace(/\r\n?/g,'\n').split('\n').entries()){
    const content=raw.trim();if(!content)continue;
    const kinds=[],names=candidates.filter(c=>typeof c.name==='string'&&c.name&&content.includes(c.name)).map(c=>c.id);
    if(hasAddress(content))kinds.push('address');if(hasTimecode(content))kinds.push('timecode');if(names.length)kinds.push('name');
    if(!kinds.length)continue;
    if(content.length>400)throw new Error('第'+(index+1)+'行超过400字，请按原文换行后再整理。');
    lines.push({id:'line-'+(index+1),lineNumber:index+1,text:content,kinds,matchedCandidateIds:names});
    if(lines.length>MAX_LINES)throw new Error('找到超过40行线索，请分段整理，避免混入不同门店。');
  }
  return lines;
}

export function createIntakeMaterial(input,selectedLineIds,candidateId,catalog,id){
  const title=requireText(input.title,'材料标题',180),url=sourceURL(input.url);
  if(typeof input.url!=='string'||input.url.length>2000||!url)throw new Error('请填写不含用户名和密码、且不超过2000字的HTTPS原页链接。');
  if(typeof input.author!=='string'||input.author.length>100)throw new Error('作者名称不能超过100字。');
  if(typeof input.observedOn!=='string'||!validDate(input.observedOn))throw new Error('请填写有效的读取日期。');
  if(typeof input.publishedOn!=='string'||input.publishedOn&&!validDate(input.publishedOn))throw new Error('资料发布日期无效，未知可留空。');
  if(!catalog.candidates.some(c=>c.id===candidateId))throw new Error('只能归入当前已有候选。');
  if(typeof id!=='string'||!/^material-[a-zA-Z\d-]{1,65}$/.test(id))throw new Error('材料编号无效。');
  const lines=analyzeDescription(input.text,catalog),byId=new Map(lines.map(line=>[line.id,line]));
  if(!Array.isArray(selectedLineIds)||!selectedLineIds.length||new Set(selectedLineIds).size!==selectedLineIds.length||selectedLineIds.some(key=>!byId.has(key)))throw new Error('请先勾选有效的文字线索。');
  // Preserve source order regardless of checkbox click order.
  const chosen=lines.filter(line=>selectedLineIds.includes(line.id));
  const note=[input.author.trim()?'作者：'+input.author.trim():'',
    '手动归入本候选；以下仅为原简介文字线索，不确认分店、地图点、入口、营业、播放或素材使用。',
    ...chosen.map(line=>'第'+line.lineNumber+'行：'+line.text)].filter(Boolean).join('\n');
  if(note.length>2000)throw new Error('所选线索超过一份材料的2000字限制，请减少选择或分次整理。');
  return {candidateId,evidence:{id,kind:'creator-page',title,url,reference:'',observedOn:input.observedOn,publishedOn:input.publishedOn,note}};
}
