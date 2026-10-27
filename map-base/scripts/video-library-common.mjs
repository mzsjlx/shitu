import {createHash} from 'node:crypto';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function mediaKey(source,segment){return digest(JSON.stringify({source:source.sourceSHA256,id:segment.id,start:segment.start,end:segment.end,poster:segment.posterSecond,profile:'h264-crf21-aac128-v1'})).slice(0,16);}
export function mediaNames(source,segment){const key=mediaKey(source,segment);return {clip:`${segment.id}-${key}.mp4`,poster:`${segment.id}-${key}.jpg`};}
