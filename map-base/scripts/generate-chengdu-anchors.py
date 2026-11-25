import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[1]
city_id = 'chengdu'
data_dir = root / f'data/cities/{city_id}'

lib_data = json.loads((data_dir / 'video-library.json').read_text(encoding='utf8'))
net_data = json.loads((data_dir / 'food-road-network.json').read_text(encoding='utf8'))

# Index nodes: id -> (lon, lat)
nodes = {n[0]: (n[1], n[2]) for n in net_data['nodes']}

# Index ways: list of ways with their node coordinates
ways = []
for w in net_data['ways']:
    way_nodes = [nodes[ref] for ref in w['nodes'] if ref in nodes]
    if len(way_nodes) >= 2:
        ways.append({
            'id': w['id'],
            'name': w.get('tags', {}).get('name') or w.get('tags', {}).get('highway', '未命名道路'),
            'node_refs': [ref for ref in w['nodes'] if ref in nodes],
            'node_coords': way_nodes,
            'tags': w.get('tags', {})
        })

def haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# For each on-map segment, find the closest node and way
anchors = []
for s in lib_data['sources']:
    for seg in s['segments']:
        coords = seg.get('coordinates')
        if not coords or coords[0] is None:
            continue
        
        slon, slat = coords
        best_dist = float('inf')
        best_way = None
        best_node_id = None
        best_node_coords = None
        
        # Search among ways
        for w in ways:
            for n_id, (nlon, nlat) in zip(w['node_refs'], w['node_coords']):
                d = haversine_m(slon, slat, nlon, nlat)
                if d < best_dist:
                    best_dist = d
                    best_way = w
                    best_node_id = n_id
                    best_node_coords = [nlon, nlat]
        
        anchors.append({
            'segmentId': seg['id'],
            'shopName': seg['name'],
            'coordinates': [slon, slat],
            'anchor': {
                'kind': 'osm-way',
                'id': best_way['id'],
                'name': best_way['name'],
                'url': f"https://www.openstreetmap.org/way/{best_way['id']}",
                'nodeId': best_node_id,
                'coordinates': best_node_coords,
                'sourceDate': '2026-11-10',
                'method': 'nearest-road-reference-to-estimated-block',
                'offsetMetres': round(best_dist, 1)
            }
        })

manifest = {
    'reviewedOn': '2026-11-12',
    'source': {
        'date': '2026-11-10',
        'sha256': net_data['source']['sha256'],
        'url': net_data['source']['url'],
        'fileName': net_data['source']['fileName'],
        'attribution': net_data['source']['attribution'],
        'license': net_data['source']['license']
    },
    'scope': 'Nearest original OSM road references for existing Chengdu video-address block estimates; coordinates unchanged; not independent shop/address verification.',
    'anchors': anchors
}

out_file = data_dir / 'location-anchors.json'
out_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(f"Successfully generated {out_file} with {len(anchors)} anchors.")
