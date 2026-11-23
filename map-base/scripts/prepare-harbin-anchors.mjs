import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, nearestRoadSnaps } from '../src/food-road-router.js';
import { distanceMetres } from '../src/walk-graph.js';
import { validateVideoLibrary } from '../src/video-library-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const net = JSON.parse(await readFile('data/cities/harbin/food-road-network.json', 'utf8'));
const router = buildFoodRoadRouter(net);
const catalog = JSON.parse(await readFile('data/cities/harbin/video-library.json', 'utf8'));

let updatedCount = 0;
for (const src of catalog.sources) {
  for (const seg of src.segments) {
    if (!seg.coordinates) continue;
    const snaps = nearestRoadSnaps(router, seg.coordinates, 250);
    if (!snaps.length) throw new Error('Cannot snap: ' + seg.id);
    const snap = snaps[0];
    const way = router.graph.ways.get(snap.segment.way);
    const wayName = way?.tags?.name || '未命名开放道路';
    const nodeA = router.graph.nodes.get(snap.segment.a);
    const nodeB = router.graph.nodes.get(snap.segment.b);
    const distA = distanceMetres(seg.coordinates, nodeA.point);
    const distB = distanceMetres(seg.coordinates, nodeB.point);
    const closestNode = distA <= distB ? nodeA : nodeB;
    const offsetMetres = Number(snap.offsetMetres.toFixed(1));

    seg.planningLocation = {
      accuracy: 'approximate',
      label: seg.planningLocation?.label || wayName,
      basis: 'video-address',
      branchMatch: 'unconfirmed',
      note: `按原片地址线索采用开放地图道路【${wayName}】（OSM way ${snap.segment.way}，节点 ${closestNode.id}）作为街区近似参照，距参考道路约 ${offsetMetres} 米，未核实店门精确入口或营业状态。`,
      reviewedOn: '2026-11-17',
      anchor: {
        kind: 'osm-way',
        id: snap.segment.way,
        name: wayName,
        url: `https://www.openstreetmap.org/way/${snap.segment.way}`,
        nodeId: closestNode.id,
        coordinates: [closestNode.point[0], closestNode.point[1]],
        sourceDate: '2026-11-17',
        method: 'nearest-road-reference-to-estimated-block',
        offsetMetres
      }
    };
    updatedCount++;
  }
}

// Validate model before saving
validateVideoLibrary(catalog, 'harbin');

await writeFile('data/cities/harbin/video-library.json', JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`Successfully updated ${updatedCount} segments with real OSM anchors.`);
