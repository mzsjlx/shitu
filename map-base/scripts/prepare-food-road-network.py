"""Retain OSM road topology for approximate food-trip distances; no provider API."""
import argparse, hashlib, json, shutil, tempfile
from pathlib import Path
import osmium

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pbf', type=Path, default=root / '.local/chongqing-261025.osm.pbf')
parser.add_argument('--source-date', default='2026-10-25')
parser.add_argument('--sha256', default='ea1bd60ca0a71231f6ec62bb5ff270594e56559c88d483e25c7e60bcc6fd20ba')
args = parser.parse_args()
source_path = args.pbf.resolve(strict=True)
source_hash = hashlib.file_digest(source_path.open('rb'), 'sha256').hexdigest()
if source_hash != args.sha256:
    raise ValueError('Raw OSM extract hash differs; review the new snapshot before rebuilding.')
config = json.loads((root / 'config/cities.json').read_text(encoding='utf8'))
city = config['activeCity']; bounds = config['cities'][city]['bounds']
west, south, east, north = bounds
keys = {'highway','name','foot','access','bridge','tunnel','layer','area','indoor','level',
        'construction','proposed','disused','abandoned','barrier','oneway:foot','foot:forward','foot:backward'}
def tags_of(obj):
    return {t.k:t.v for t in obj.tags if t.k in keys or ('conditional' in t.k and t.k.startswith(('access','foot','oneway')))}

# libosmium on Windows needs an ASCII filename; this temporary copy is verified above.
with tempfile.TemporaryDirectory(prefix='shitu-road-') as temp:
    pbf = Path(temp) / 'source.osm.pbf'; shutil.copyfile(source_path, pbf)
    nodes = {}
    for node in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        if not node.location.valid(): continue
        lon, lat = node.location.lon, node.location.lat
        if west <= lon <= east and south <= lat <= north:
            nodes[node.id] = [node.id, lon, lat, tags_of(node)]
    ways = []; used = set()
    for way in osmium.FileProcessor(str(pbf), osmium.osm.WAY):
        if not way.tags.get('highway'): continue
        refs = [n.ref for n in way.nodes]
        if not any(n in nodes for n in refs): continue
        ways.append({'id':way.id, 'nodes':refs, 'tags':tags_of(way)})
        used.update(n for n in refs if n in nodes)
    way_ids = {w['id'] for w in ways}; excluded = set()
    for rel in osmium.FileProcessor(str(pbf), osmium.osm.RELATION):
        t = dict((t.k,t.v) for t in rel.tags)
        if t.get('restriction:foot') or (t.get('type') == 'restriction' and t.get('restriction:conditional') and 'foot' not in t.get('except','').split(';')):
            excluded.update(m.ref for m in rel.members if m.type == 'w' and m.ref in way_ids)
    data = {'schemaVersion':1,'kind':'food-road-planning-network','city':city,'coordinateSystem':'WGS84',
        'bounds':bounds,'source':{'date':args.source_date,'sha256':source_hash,
        'url':'https://download.geofabrik.de/asia/china/chongqing.html','fileName':source_path.name,
        'attribution':'© OpenStreetMap contributors','license':'ODbL 1.0'},
        'nodes':[nodes[n] for n in sorted(used)],'ways':ways,'excludedFootRestrictionWays':sorted(excluded),
        'limitations':['仅当前地图范围内的道路网络，边界外的绕行可能缺失。','按步行参考规则计算道路二维长度，门店街区点与道路之间的短虚线不计入道路长度。','不校验店门、现场通行或楼层；不提供逐向导航或步行时间。']}
    raw = (json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf8')
    target = root / 'data/food-road-network.json'; target.write_bytes(raw)
    manifest = {'schemaVersion':1,'city':city,'bounds':bounds,'source':data['source'],
        'networkSHA256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'nodes':len(data['nodes']),
        'ways':len(ways),'footRestrictionWays':len(excluded),'topology':'Only consecutive original OSM node IDs connect; missing nodes break ways. No links are invented at geometric crossings.',
        'profile':'Approximate walking reference: no motorways or known foot/access restrictions; source bridges and tunnels may connect only at their original nodes.'}
    (root / 'data/food-road-network-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:manifest[k] for k in ['nodes','ways','bytes','networkSHA256']}))
