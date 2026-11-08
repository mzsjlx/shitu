"""Compare Nanjing road topology and every adopted location to the frozen OSM PBF."""
import argparse, hashlib, json, shutil, tempfile, math
from datetime import datetime, timezone, timedelta
from pathlib import Path
import osmium

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pbf', type=Path, required=True)
args = parser.parse_args()
data = json.loads((root / 'data/cities/nanjing/food-road-network.json').read_text(encoding='utf-8'))
catalog = json.loads((root / 'data/cities/nanjing/video-library.json').read_text(encoding='utf-8'))
with args.pbf.open('rb') as f:
    assert hashlib.file_digest(f, 'sha256').hexdigest() == data['source']['sha256']
nodes = {n[0]: n for n in data['nodes']}
ways = {w['id']: w for w in data['ways']}
segments = [s for src in catalog['sources'] for s in src['segments'] if s.get('coordinates')]
anchors = {s['planningLocation']['anchor']['id'] for s in segments}
anchor_nodes = {s['planningLocation']['anchor']['nodeId'] for s in segments}
found_nodes, found_ways, original_nodes, original_ways = set(), set(), {}, {}
with tempfile.TemporaryDirectory(prefix='shitu-nanjing-source-') as temp:
    pbf = Path(temp) / 'original.osm.pbf'
    shutil.copyfile(args.pbf, pbf)
    for node in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        coords = [node.location.lon, node.location.lat]
        if node.id in anchor_nodes: original_nodes[node.id] = coords
        if node.id not in nodes: continue
        saved = nodes[node.id]; found_nodes.add(node.id)
        assert saved[1:3] == coords, f'Coordinate mutation: {node.id}'
        tags = dict(node.tags)
        assert all(tags.get(k) == v for k, v in saved[3].items()), f'Node tags: {node.id}'
    for way in osmium.FileProcessor(str(pbf), osmium.osm.WAY):
        refs = [n.ref for n in way.nodes]
        if way.id in anchors: original_ways[way.id] = {'nodes': refs, 'name': way.tags.get('name', '')}
        if way.id not in ways: continue
        saved = ways[way.id]; found_ways.add(way.id)
        assert saved['nodes'] == refs, f'Node order mutation: {way.id}'
        tags = dict(way.tags)
        assert all(tags.get(k) == v for k, v in saved['tags'].items()), f'Way tags: {way.id}'
assert found_nodes == nodes.keys() and found_ways == ways.keys(), 'Unknown road source IDs'
checks = []
for s in segments:
    a = s['planningLocation']['anchor']
    assert a['id'] in original_ways, f'Unknown anchor way: {s["id"]}'
    assert a['nodeId'] in original_ways[a['id']]['nodes'], f'Node is not on claimed way: {s["id"]}'
    actual = original_nodes[a['nodeId']]
    # Some original entries round WGS84 to six decimal places (<0.12 m).
    if a['method'] == 'nearby-original-way-node':
        assert a['coordinates'] == actual, f'Reference coordinate mismatch: {s["id"]}'
        dx=(s['coordinates'][0]-actual[0])*111195*math.cos(math.radians(actual[1]))
        dy=(s['coordinates'][1]-actual[1])*111195
        offset=math.hypot(dx,dy)
        assert offset<=60 and abs(offset-a['offsetMetres'])<0.02, f'Undisclosed estimate offset: {s["id"]}'
    else:
        assert all(abs(x-y) <= 0.00000051 for x,y in zip(s['coordinates'], actual)), f'Anchor coordinate mismatch: {s["id"]}'
    checks.append({'segmentId':s['id'], 'wayId':a['id'], 'nodeId':a['nodeId'], 'sourceWayName':original_ways[a['id']]['name'], 'passed':True})
report = {'verifiedOn':datetime.now(timezone(timedelta(hours=8))).date().isoformat(), 'passed':True,
          'sourceSHA256':data['source']['sha256'], 'nodesChecked':len(nodes), 'waysChecked':len(ways),
          'locationChecks':checks, 'scope':'Frozen OSM node coordinates, tags, full way node order and membership. Approximate street references only; not independent confirmation of each shop address or current business.'}
(root.parent / 'output/research/nanjing/nanjing-source-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'passed':True, 'nodesChecked':len(nodes), 'waysChecked':len(ways), 'locatedSegments':len(checks)}))
