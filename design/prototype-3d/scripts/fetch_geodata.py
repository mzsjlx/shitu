"""Download a bounded OSM excerpt for the local Chongqing modeling study."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data"
DEST.mkdir(parents=True, exist_ok=True)
BBOX = (29.558, 106.566, 29.573, 106.584)
ENDPOINT = "https://overpass.private.coffee/api/interpreter"
box = ",".join(map(str, BBOX))
QUERY = f'''[out:json][timeout:40];(
way[building]({box});
way["building:part"]({box});
way[highway]({box});
way[railway]({box});
way["natural"="water"]({box});
relation["natural"="water"]({box});
way[waterway]({box});
way["landuse"~"forest|grass|recreation_ground"]({box});
way["leisure"~"park|garden"]({box});
nwr["name"~"洪崖洞|千厮门|千廝門"]({box});
);out geom;'''

target = DEST / "osm-raw.json"
if target.exists():
    raw = target.read_bytes()
else:
    request = Request(ENDPOINT, data=urlencode({"data": QUERY}).encode(), headers={"User-Agent": "FoodCityLocalDesignStudy/0.1", "Content-Type": "application/x-www-form-urlencoded"})
    with urlopen(request, timeout=55) as response:
        raw = response.read()
    data = json.loads(raw)
    if data.get("remark"):
        raise RuntimeError(data["remark"])
    target.write_bytes(raw)
    (DEST / "osm-query.txt").write_text(QUERY, encoding="utf-8")
    (DEST / "osm-source.json").write_text(json.dumps({"endpoint": ENDPOINT, "bboxSouthWestNorthEast": BBOX, "retrievedAt": datetime.now(timezone.utc).isoformat(), "sha256": hashlib.sha256(raw).hexdigest(), "attribution": "© OpenStreetMap contributors", "license": "ODbL 1.0", "licenseUrl": "https://www.openstreetmap.org/copyright", "osmTimestamp": data.get("osm3s", {}).get("timestamp_osm_base")}, ensure_ascii=False, indent=2), encoding="utf-8")
data = json.loads(raw)
elements = data["elements"]
buildings = [e for e in elements if "building" in e.get("tags", {})]
print(json.dumps({"bytes": len(raw), "elements": len(elements), "buildings": len(buildings), "withHeight": sum("height" in e["tags"] for e in buildings), "withLevels": sum("building:levels" in e["tags"] for e in buildings), "water": [{"id":e["id"],"type":e["type"],"tags":e["tags"],"points":len(e.get("geometry",[]))} for e in elements if e.get("tags",{}).get("natural")=="water"], "landmarks": [{"id":e["id"],"type":e["type"],"tags":e.get("tags"),"center":e.get("center"),"lat":e.get("lat"),"lon":e.get("lon")} for e in elements if any(s in e.get("tags", {}).get("name", "") for s in ["洪崖洞", "千厮门", "千廝門"])]}, ensure_ascii=False))
