const fs = require('fs');
const lib = JSON.parse(fs.readFileSync('map-base/data/cities/chengdu/video-library.json', 'utf-8'));
lib.sources.forEach(s => {
  s.segments.forEach(seg => {
    const coord = seg.coordinates ? seg.coordinates.map(n => n.toFixed(4)).join(',') : 'NO COORD';
    const label = (seg.planningLocation && seg.planningLocation.label) || '';
    console.log(seg.id.padEnd(32) + ' | ' + seg.name.padEnd(26) + ' | ' + coord.padEnd(19) + ' | ' + label);
  });
});
console.log('Total segments:', lib.sources.reduce((sum, s) => sum + s.segments.length, 0));
