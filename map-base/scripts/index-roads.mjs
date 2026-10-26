import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PMTiles } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';

// Read only the retained local archive. No request to a public tile server is made.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
const cityOption=process.argv.indexOf('--city');
const cityId=cityOption>=0?process.argv[cityOption+1]:config.activeCity;
if(!config.cities[cityId])throw new Error('City is not configured.');
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
const header = await archive.getHeader();
const metadata = JSON.parse(await readFile(path.join(root, city.dataFiles.tileMetadata), 'utf8'));
const z = 15;
if (header.maxZoom < z) throw new Error('The retained archive does not contain z15 detail.');

function tileXY(lon, lat, zoom) {
  const n = 2 ** zoom;
  return [Math.floor((lon + 180) / 360 * n), Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n)];
}
function intersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}
function extend(box, point) {
  box[0] = Math.min(box[0], point[0]); box[1] = Math.min(box[1], point[1]);
  box[2] = Math.max(box[2], point[0]); box[3] = Math.max(box[3], point[1]);
}
function emptyBounds() { return [Infinity, Infinity, -Infinity, -Infinity]; }
function geometryBounds(geometry) {
  const box = emptyBounds();
  function visit(value) {
    if (typeof value[0] === 'number') extend(box, value);
    else for (const child of value) visit(child);
  }
  visit(geometry.coordinates);
  return box;
}
// Liang–Barsky clipping keeps the search bounds and anchor on actual lines in the city cutout.
function clipSegment(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - bounds[0], bounds[2] - a[0], a[1] - bounds[1], bounds[3] - a[1]];
  let start = 0, end = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) start = Math.max(start, t); else end = Math.min(end, t);
    if (start > end) return null;
  }
  if (end - start < 1e-12) return null;
  return [[a[0] + start * dx, a[1] + start * dy], [a[0] + end * dx, a[1] + end * dy]];
}
function clippedLineParts(geometry) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
  const parts = [];
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const part = clipSegment(line[i - 1], line[i]);
    if (part) parts.push(part);
  }
  return parts;
}
function segmentLength([a, b]) {
  const latitude = (a[1] + b[1]) / 2 * Math.PI / 180;
  return Math.hypot((b[0] - a[0]) * Math.cos(latitude), b[1] - a[1]);
}
function addVote(votes, value) { votes.set(value, (votes.get(value) || 0) + 1); }
function preferred(votes) { return [...votes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || ''; }
function round(value) { return Math.round(value * 1e7) / 1e7; }

const allowedRoadKinds = new Set(['highway', 'major_road', 'minor_road', 'path', 'pier']);
const named = new Map();
const counters = { requestedTiles: 0, presentTiles: 0, roadLineFragments: 0, namedRoadLineFragments: 0, unnamedRoadLineFragments: 0, nonRoadTransportFragmentsExcluded: 0, buildingPolygonFragments: 0, buildingFragmentsWithPositiveHeight: 0, buildingFragmentsWithoutPositiveHeight: 0 };
const roadClassCounts = {};
const [left, top] = tileXY(bounds[0], bounds[3], z);
const [right, bottom] = tileXY(bounds[2], bounds[1], z);
for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
  counters.requestedTiles++;
  const tileBytes = await archive.getZxy(z, x, y);
  if (!tileBytes) continue;
  counters.presentTiles++;
  const tile = new VectorTile(new PbfReader(tileBytes.data));
  const roads = tile.layers.roads;
  if (roads) for (let i = 0; i < roads.length; i++) {
    const feature = roads.feature(i);
    if (feature.type !== 2) continue;
    const properties = feature.properties;
    const geometry = feature.toGeoJSON(x, y, z).geometry;
    if (!intersects(geometryBounds(geometry), bounds)) continue;
    const parts = clippedLineParts(geometry);
    if (!parts.length) continue;
    if (!allowedRoadKinds.has(properties.kind)) { counters.nonRoadTransportFragmentsExcluded++; continue; }
    counters.roadLineFragments++;
    roadClassCounts[properties.kind] = (roadClassCounts[properties.kind] || 0) + 1;
    const name = String(properties['name:zh-Hans'] || properties.name || '').trim();
    if (!name) { counters.unnamedRoadLineFragments++; continue; }
    counters.namedRoadLineFragments++;
    if (!named.has(name)) named.set(name, { name, bounds: emptyBounds(), center: null, longestSegment: -1, classes: new Map(), details: new Map(), bridge: false, tunnel: false, bridgeFragments: 0, tunnelFragments: 0, segments: 0 });
    const entry = named.get(name);
    entry.segments++;
    entry.bridge ||= properties.is_bridge === true;
    entry.tunnel ||= properties.is_tunnel === true;
    if (properties.is_bridge === true) entry.bridgeFragments++;
    if (properties.is_tunnel === true) entry.tunnelFragments++;
    addVote(entry.classes, String(properties.kind || ''));
    addVote(entry.details, String(properties.kind_detail || ''));
    for (const part of parts) {
      extend(entry.bounds, part[0]); extend(entry.bounds, part[1]);
      const length = segmentLength(part);
      if (length > entry.longestSegment) {
        entry.longestSegment = length;
        entry.center = [(part[0][0] + part[1][0]) / 2, (part[0][1] + part[1][1]) / 2];
      }
    }
  }
  const buildings = tile.layers.buildings;
  if (buildings) for (let i = 0; i < buildings.length; i++) {
    const feature = buildings.feature(i);
    if (feature.type !== 3 || !intersects(geometryBounds(feature.toGeoJSON(x, y, z).geometry), bounds)) continue;
    counters.buildingPolygonFragments++;
    const height = feature.properties.height;
    if (typeof height === 'number' && Number.isFinite(height) && height > 0) counters.buildingFragmentsWithPositiveHeight++;
    else counters.buildingFragmentsWithoutPositiveHeight++;
  }
}
const roads = [...named.values()].map(entry => ({
  id: 'road:' + entry.name,
  class: preferred(entry.classes), detail: preferred(entry.details), name: entry.name,
  bounds: entry.bounds.map(round), center: entry.center.map(round), bridge: entry.bridge, tunnel: entry.tunnel,
  bridgeFragments: entry.bridgeFragments, tunnelFragments: entry.tunnelFragments, segments: entry.segments,
})).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

const validEntries = roads.every(road => [...road.bounds, ...road.center].every(Number.isFinite) && road.bounds[0] >= bounds[0] - 1e-7 && road.bounds[1] >= bounds[1] - 1e-7 && road.bounds[2] <= bounds[2] + 1e-7 && road.bounds[3] <= bounds[3] + 1e-7 && road.center[0] >= road.bounds[0] && road.center[0] <= road.bounds[2] && road.center[1] >= road.bounds[1] && road.center[1] <= road.bounds[3]);
if (!validEntries || !roads.length) throw new Error('Road index is empty or has out-of-bounds anchors.');
const index = { schemaVersion: 1, city: cityId, coordinateSystem: 'WGS84', bounds, source: 'Protomaps / OSM', sourceArchive: city.tiles, sourceZoom: z, osmReplicationTime: metadata['planetiler:osm:osmosisreplicationtime'], attribution: '© OpenStreetMap contributors · Protomaps', license: 'ODbL 1.0', notes: ['Names group vector-tile fragments for local search; they are not unique physical road identifiers.', 'Bounds are clipped to the configured city cutout. Center is a point on the longest retained straight segment, not an address or entrance.', 'Bridge/tunnel flags mean at least one grouped fragment has the corresponding source flag.', 'This is a display/search index, not a routing graph. Tile fragments can repeat across tile boundaries.'], roads };
const requestedSamples = ['嘉滨路', '沧白路', '千厮门大桥'];
const samples = Object.fromEntries(requestedSamples.map(name => [name, { exact: roads.find(road => road.name === name) || null, related: roads.filter(road => name === '嘉滨路' ? /嘉滨|嘉陵江滨江/.test(road.name) : road.name.includes(name)).map(road => road.name) }]));
const audit = { schemaVersion: 1, city: cityId, source: 'Protomaps / OpenStreetMap', scope: 'Configured central-urban cutout, not the whole Chongqing municipality', bounds, sourceZoom: z, archiveBytes: archiveBytes.byteLength, archiveHeader: { minZoom: header.minZoom, maxZoom: header.maxZoom, bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat] }, osmReplicationTime: index.osmReplicationTime, counters: { ...counters, namedRoadGroups: roads.length }, roadClassCounts, checks: { finiteAndClippedSearchBoundsAndAnchors: validEntries, everyRequestedTilePresent: counters.requestedTiles === counters.presentTiles, roadFragmentsHaveNamedOrUnnamedCounts: counters.namedRoadLineFragments + counters.unnamedRoadLineFragments === counters.roadLineFragments, buildingHeightCountsBalance: counters.buildingFragmentsWithPositiveHeight + counters.buildingFragmentsWithoutPositiveHeight === counters.buildingPolygonFragments }, samples, limitations: ['All counts are z15 vector-tile fragments except namedRoadGroups; clipped duplicates are not deduplicated physical assets.', 'A positive source height is a supplied basemap height, not a claim of survey accuracy or explicit OSM height provenance.', 'Road intersection coordinates, bridge/tunnel/floor connectivity, access and turn restrictions are not validated by this index.'] };
await mkdir(path.dirname(path.join(root,city.dataFiles.index)),{recursive:true});
await mkdir(path.dirname(path.join(root,city.dataFiles.audit)),{recursive:true});
await writeFile(path.join(root, city.dataFiles.index), JSON.stringify(index), 'utf8');
await writeFile(path.join(root, city.dataFiles.audit), JSON.stringify(audit, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ counters: audit.counters, checks: audit.checks, samples }, null, 2));

