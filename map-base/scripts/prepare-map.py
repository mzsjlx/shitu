"""Cache a small, self-hosted Protomaps extract. No production calls to demo tiles."""
import argparse, hashlib, io, json, subprocess, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
TOOLS = ROOT / 'tools'
DATA.mkdir(exist_ok=True)
TOOLS.mkdir(exist_ok=True)
HEADERS = {'User-Agent': 'FoodCity-map-base/0.3 local-prototype'}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--city', default=None)
parser.add_argument('--build', default=None, help='Retained Protomaps build, e.g. 20261020')
parser.add_argument('--refresh', action='store_true', help='Replace an existing retained city archive')
args = parser.parse_args()
config = json.loads((ROOT / 'config/cities.json').read_text(encoding='utf8'))
city_id = args.city or config['activeCity']
if city_id not in config['cities']:
    parser.error('City is not configured; add its bounds and independent dataFiles first.')
city = config['cities'][city_id]
manifest_path = (ROOT / city['dataFiles']['manifest']).resolve()
metadata_path = (ROOT / city['dataFiles']['tileMetadata']).resolve()
target = (ROOT / city['tiles']).resolve()
if not all(p.is_relative_to(ROOT) for p in [manifest_path, metadata_path, target]):
    raise ValueError('All city files must stay within this project.')
for p in [manifest_path, metadata_path, target]:
    p.parent.mkdir(parents=True, exist_ok=True)

def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=90) as r:
        return r.read()

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

exe = TOOLS / 'pmtiles.exe'
if not exe.exists():
    release = json.loads(fetch('https://api.github.com/repos/protomaps/go-pmtiles/releases/latest'))
    asset = next(a for a in release['assets'] if a['name'].endswith('Windows_x86_64.zip'))
    raw = fetch(asset['browser_download_url'])
    with zipfile.ZipFile(io.BytesIO(raw)) as package:
        name = next(n for n in package.namelist() if Path(n).name == 'pmtiles.exe')
        exe.write_bytes(package.read(name))
    (TOOLS / 'SOURCE.json').write_text(json.dumps({'release': release['tag_name'], 'url': asset['browser_download_url'], 'archiveSha256': digest(raw), 'binarySha256': digest(exe.read_bytes()), 'note': 'Downloaded official release; no separate published checksum was available in release assets.'}, indent=2), encoding='utf8')

if target.exists() and not args.refresh:
    retained = json.loads(manifest_path.read_text(encoding='utf8'))
    if retained['bbox'] != city['bounds'] or retained['sha256'] != digest(target.read_bytes()):
        raise ValueError('Cached city bounds or hash mismatch; inspect or explicitly --refresh.')
    print('Using verified cached '+city_id+' archive; no repeat download.')
else:
    builds = json.loads(fetch('https://build-metadata.protomaps.dev/builds.json'))
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    candidates = [b for b in builds if b['key'].endswith('.pmtiles') and b['key'][:8] <= today]
    if args.build:
        candidates = [b for b in candidates if b['key'] == args.build+'.pmtiles']
    if not candidates:
        raise ValueError('The requested build is not available in the retained upstream channel.')
    source = sorted(candidates, key=lambda b: b['key'])[-1]
    source_url = 'https://build.protomaps.com/' + source['key']
    partial = target.with_name(target.stem+'.partial.pmtiles')
    args = [str(exe), 'extract', source_url, str(partial), '--bbox=' + ','.join(map(str, city['bounds'])), '--maxzoom=15', '--download-threads=2']
    subprocess.run(args, check=True)
    subprocess.run([str(exe), 'verify', str(partial)], check=True)
    partial.replace(target)
    report = {'city': city_id, 'acquiredAtUTC': datetime.now(timezone.utc).isoformat(), 'source': source_url, 'upstreamBuild': source, 'bbox': city['bounds'], 'maxzoom': 15, 'bytes': target.stat().st_size, 'sha256': digest(target.read_bytes()), 'license': 'ODbL 1.0 Produced Work', 'attribution': 'OpenStreetMap contributors, Protomaps, Natural Earth', 'scope': city['coverageLabel'], 'note': 'Archive retained locally; browser does not hotlink the build server.'}
    manifest_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps(report, ensure_ascii=False))

result = subprocess.run([str(exe), 'show', str(target), '--metadata'], capture_output=True, text=True, encoding='utf8', check=True)
metadata_path.write_text(result.stdout, encoding='utf8')
print(city_id+' archive and metadata ready.')
