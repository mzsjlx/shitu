// Credit the platform and the author of the specific video shown on this card.
export function foodVideoCredit(item){
  const video=(item.videos||[]).find(value=>value?.url)||null;
  if(!video&&!item.originalVideoURL&&!item.clipAuthor)return '';
  let platform='视频';
  try{
    const host=new URL(video?.url||item.originalVideoURL).hostname.toLowerCase();
    if(host==='bilibili.com'||host.endsWith('.bilibili.com'))platform='B站';
    else if(host==='douyin.com'||host.endsWith('.douyin.com'))platform='抖音';
    else if(host==='xiaohongshu.com'||host.endsWith('.xiaohongshu.com'))platform='小红书';
    else if(host==='youtube.com'||host.endsWith('.youtube.com')||host==='youtu.be')platform='YouTube';
    else platform=host;
  }catch{}
  const author=item.clipAuthor||video?.author;
  return '来源：'+platform+(author?' · '+author:'')+(item.clipFootageNote?' · '+item.clipFootageNote.split(' · ')[0]:'');
}
