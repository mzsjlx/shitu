import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PMTiles } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import crypto from 'node:crypto';
import { buildFoodRoadRouter } from '../src/food-road-router.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
const cityId = 'chaoshan';
const city = config.cities[cityId];
const bounds = city.bounds;
const archivePath = path.resolve(root, city.tiles);
const archiveBytes = await readFile(archivePath);

const archive = new PMTiles({
  getKey: () => archivePath,
  getBytes: async (offset, length) => {
    const bytes = archiveBytes.subarray(offset, offset + length);
    return { data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  },
});

function tileXY(lon, lat, zoom) {
  const n = 2 ** zoom;
  return [Math.floor((lon + 180) / 360 * n), Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n)];
}

const z = 15;
const [left, top] = tileXY(bounds[0], bounds[3], z);
const [right, bottom] = tileXY(bounds[2], bounds[1], z);

console.log(`Extracting roads from tile range [${left}, ${top}] to [${right}, ${bottom}] for ${cityId}...`);

const nodeMap = new Map(); // "lon,lat" -> id
const nodes = [];
const ways = [];
let nextNodeId = 1;
let nextWayId = 1;

function getNode(lon, lat) {
  const key = `${lon.toFixed(7)},${lat.toFixed(7)}`;
  if (nodeMap.has(key)) return nodeMap.get(key);
  const id = nextNodeId++;
  nodeMap.set(key, id);
  nodes.push([id, lon, lat, {}]);
  return id;
}

const allowedHighway = new Set([
  'footway', 'path', 'pedestrian', 'steps',
  'residential', 'living_street', 'service', 'unclassified',
  'tertiary', 'secondary', 'primary', 'tertiary_link', 'secondary_link', 'primary_link'
]);

for (let y = top; y <= bottom; y++) {
  for (let x = left; x <= right; x++) {
    const tileBytes = await archive.getZxy(z, x, y);
    if (!tileBytes) continue;
    const tile = new VectorTile(new PbfReader(tileBytes.data));
    const roadsLayer = tile.layers.roads;
    if (!roadsLayer) continue;

    for (let i = 0; i < roadsLayer.length; i++) {
      const feat = roadsLayer.feature(i);
      if (feat.type !== 2) continue; // LineString
      const props = feat.properties;
      const geom = feat.toGeoJSON(x, y, z).geometry;
      if (!geom) continue;

      const highway = props.kind_detail || props.kind || props.highway || 'residential';
      if (!allowedHighway.has(highway) && props.class !== 'major_road' && props.class !== 'minor_road' && props.class !== 'path') {
        continue;
      }

      const lines = geom.type === 'LineString' ? [geom.coordinates] : geom.type === 'MultiLineString' ? geom.coordinates : [];
      for (const line of lines) {
        if (line.length < 2) continue;
        const nodeIds = [];
        for (const coord of line) {
          const lon = Math.round(coord[0] * 1e7) / 1e7;
          const lat = Math.round(coord[1] * 1e7) / 1e7;
          nodeIds.push(getNode(lon, lat));
        }

        const tags = {
          highway,
          name: props['name:zh-Hans'] || props.name || '',
        };
        if (props.is_bridge) tags.bridge = 'yes';
        if (props.is_tunnel) tags.tunnel = 'yes';
        if (props['oneway:foot']) tags['oneway:foot'] = props['oneway:foot'];

        ways.push({
          id: nextWayId++,
          nodes: nodeIds,
          tags,
        });
      }
    }
  }
}

console.log(`Extracted ${nodes.length} nodes, ${ways.length} ways.`);

const sourceManifest = JSON.parse(await readFile(path.join(root, city.dataFiles.manifest), 'utf8'));

const networkData = {
  schemaVersion: 1,
  kind: 'food-road-planning-network',
  city: cityId,
  coordinateSystem: 'WGS84',
  bounds,
  source: {
    date: sourceManifest.acquiredAtUTC.slice(0, 10),
    sha256: sourceManifest.sha256,
    url: sourceManifest.source,
    fileName: 'chaoshan.pmtiles',
    attribution: '© OpenStreetMap contributors · Protomaps',
    license: 'ODbL 1.0 Produced Work'
  },
  nodes,
  ways,
  excludedFootRestrictionWays: [],
  limitations: [
    '仅当前地图范围内的道路网络，边界外的绕行可能缺失。',
    '按步行参考规则计算道路二维长度，门店街区点与道路之间的短虚线不计入道路长度。',
    '不校验店门、现场通行或楼层；不提供逐向导航或步行时间。'
  ]
};

// Test with router
const router = buildFoodRoadRouter(networkData);
console.log('Router built successfully! Stats:', router.stats);

const outDir = path.join(root, 'data/cities/chaoshan');
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, 'food-road-network.json');
const raw = JSON.stringify(networkData);
await writeFile(outPath, raw + '\n', 'utf8');

const sha256 = crypto.createHash('sha256').update(raw).digest('hex');
const manifest = {
  schemaVersion: 1,
  city: cityId,
  bounds,
  source: networkData.source,
  networkSHA256: sha256,
  bytes: Buffer.byteLength(raw),
  nodes: nodes.length,
  ways: ways.length,
  footRestrictionWays: 0,
  topology: 'Connected node topology extracted from local OSM/Protomaps archive.',
  profile: 'Approximate walking reference: no motorways; connecting pedestrian and ordinary roads.'
};
await writeFile(path.join(outDir, 'food-road-network-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Saved ${outPath} (${(Buffer.byteLength(raw) / 1024 / 1024).toFixed(2)} MB), SHA256: ${sha256}`);
