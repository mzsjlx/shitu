"""Cache public Terrarium DEM tiles for the configured city, with provenance."""
import argparse, concurrent.futures, hashlib, json, math, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--city', default=None)
args = parser.parse_args()
config = json.loads((ROOT / 'config/cities.json').read_text(encoding='utf8'))
city_id = args.city or config['activeCity']
if city_id not in config['cities']:
    parser.error('City is not configured.')
city = config['cities'][city_id]
west, south, east, north = city['bounds']

def xy(lon, lat, z):
    n = 2 ** z
    return int((lon+180)/360*n), int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)

jobs = []
for z in range(city['demMinZoom'], city['demMaxZoom']+1):
    left, top = xy(west, north, z)
    right, bottom = xy(east, south, z)
    for x in range(left-1, right+2):
        for y in range(top-1, bottom+2):
            jobs.append((z, x, y))

def cache(job):
    z, x, y = job
    relative = city['demTiles'].replace('{z}', str(z)).replace('{x}', str(x)).replace('{y}', str(y))
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Terrain cache must stay in the project.')
    url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    if not path.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'FoodCity-map-base/0.3 local-prototype'})
        with urllib.request.urlopen(request, timeout=45) as r:
            raw = r.read()
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('DEM response is not PNG')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    raw = path.read_bytes()
    return {'z': z, 'x': x, 'y': y, 'url': url, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    tiles = list(pool.map(cache, jobs))
report = {'acquiredAtUTC': datetime.now(timezone.utc).isoformat(), 'source': 'https://registry.opendata.aws/terrain-tiles/', 'sourceLicense': 'https://github.com/tilezen/joerd/blob/master/docs/attribution.md', 'attribution': 'Mapzen / Tilezen; SRTM and GMTED2010 USGS, ETOPO1 NOAA', 'encoding': 'Terrarium: R*256+G+B/256-32768 metres', 'tiles': tiles, 'limitations': ['Coarse elevation model, not street/bridge/floor height verification.', 'Terrain exaggeration stays at 1.0.', 'No current river-level or construction-height claim.']}
manifest_path = ROOT / city['dataFiles']['terrainManifest']
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps({'tiles': len(tiles), 'bytes': sum(t['bytes'] for t in tiles)}))
