// A clip keeps its own media identity; matching clips share a single map stop.
export const videoPlaceId=segment=>'video-'+(segment.placeId||segment.id);

export function groupVideoPlaces(catalog){
  const groups=new Map();
  for(const source of catalog.sources)for(const segment of source.segments){
    const id=videoPlaceId(segment),entry={source,segment};
    if(!groups.has(id))groups.set(id,{id,primary:entry,clips:[]});
    const group=groups.get(id);group.clips.push(entry);
    if(segment.id===(segment.placeId||segment.id))group.primary=entry;
  }
  return [...groups.values()];
}
