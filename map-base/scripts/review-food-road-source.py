"""Independently compare retained road IDs/coordinates/order/tags to the frozen PBF."""
import argparse, hashlib, json, os, shutil, tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
import osmium

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pbf', type=Path, default=root / '.local/chongqing-261025.osm.pbf')
parser.add_argument('--report', default='FOOD-ROAD-SOURCE-QA.json')
parser.add_argument('--city', default='chongqing')
parser.add_argument('--verified-on', default=datetime.now(timezone(timedelta(hours=8))).date().isoformat())
args = parser.parse_args()
report_path = (root / args.report).resolve()
if not report_path.is_relative_to(root):
    parser.error('Report must stay within the project.')
config = json.loads((root / 'config/cities.json').read_text(encoding='utf8'))
if args.city in config['cities']:
    city_conf = config['cities'][args.city]
else:
    profile_path = root / f'data/cities/{args.city}/city-profile.json'
    if profile_path.exists():
        city_conf = json.loads(profile_path.read_text(encoding='utf8'))
    else:
        raise ValueError(f'City {args.city} is not configured.')
network = city_conf['foodContent']['roadNetwork']
data = json.loads((root / network).read_text(encoding='utf8'))
with args.pbf.open('rb') as file:
    assert hashlib.file_digest(file, 'sha256').hexdigest() == data['source']['sha256']
nodes = {n[0]:n for n in data['nodes']}
ways = {w['id']:w for w in data['ways']}
found_nodes = set(); found_ways = set()
with tempfile.TemporaryDirectory(prefix='shitu-road-audit-') as temp:
    rel = os.path.relpath(args.pbf.resolve(), Path.cwd())
    if rel.isascii():
        pbf = rel
    else:
        pbf_path = Path(temp) / 'original.osm.pbf'; shutil.copyfile(args.pbf, pbf_path)
        pbf = str(pbf_path)
    for node in osmium.FileProcessor(pbf, osmium.osm.NODE):
        if node.id not in nodes: continue
        saved = nodes[node.id]; found_nodes.add(node.id)
        assert saved[1:3] == [node.location.lon, node.location.lat], f'Coordinate mutation: {node.id}'
        original = dict((t.k,t.v) for t in node.tags)
        assert all(original.get(k) == v for k,v in saved[3].items()), f'Node tag mutation: {node.id}'
    for way in osmium.FileProcessor(pbf, osmium.osm.WAY):
        if way.id not in ways: continue
        saved = ways[way.id]; found_ways.add(way.id)
        assert saved['nodes'] == [n.ref for n in way.nodes], f'Node order mutation: {way.id}'
        original = dict((t.k,t.v) for t in way.tags)
        assert all(original.get(k) == v for k,v in saved['tags'].items()), f'Way tag mutation: {way.id}'
assert found_nodes == nodes.keys() and found_ways == ways.keys(), 'Unknown source IDs'
report = {'verifiedOn':args.verified_on,'passed':True,'sourceSHA256':data['source']['sha256'],
          'nodesChecked':len(nodes),'waysChecked':len(ways),
          'checks':['Every retained node ID exists in the frozen PBF, with identical coordinates and retained tags.',
                    'Every retained way ID exists in the frozen PBF, with identical full node order and retained tags.'],
          'scope':'Original-source preservation only; no current access or shop-entrance verification.'}
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'passed':True,'nodesChecked':len(nodes),'waysChecked':len(ways)}))
