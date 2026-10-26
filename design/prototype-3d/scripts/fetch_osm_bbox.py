"""One cached read-only bounding-box request, when Overpass is unavailable."""
import hashlib
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

DEST = Path(__file__).resolve().parents[1] / "data"
DEST.mkdir(exist_ok=True)
URL = "https://api.openstreetmap.org/api/0.6/map?bbox=106.566,29.558,106.584,29.573"
path = DEST / "osm-raw.xml"
if not path.exists():
    request = Request(URL, headers={"User-Agent": "FoodCityLocalDesignStudy/0.1", "Accept": "application/xml"})
    with urlopen(request, timeout=50) as response:
        path.write_bytes(response.read())
raw = path.read_bytes()
tree = ET.fromstring(raw)
nodes = {int(n.attrib["id"]): {"lat": float(n.attrib["lat"]), "lon": float(n.attrib["lon"])} for n in tree.findall("node")}
ways = {}
elements = []
for element in tree:
    if element.tag not in ("node", "way", "relation"):
        continue
    tags = {t.attrib["k"]: t.attrib["v"] for t in element.findall("tag")}
    obj = {"type": element.tag, "id": int(element.attrib["id"]), "tags": tags}
    if element.tag == "node":
        obj.update(nodes[obj["id"]])
    elif element.tag == "way":
        obj["nodes"] = [int(n.attrib["ref"]) for n in element.findall("nd")]
        obj["geometry"] = [nodes[n] for n in obj["nodes"] if n in nodes]
        ways[obj["id"]] = obj
    else:
        obj["members"] = [{"type": m.attrib["type"], "ref": int(m.attrib["ref"]), "role": m.attrib.get("role", "")} for m in element.findall("member")]
    if tags or element.tag != "node":
        elements.append(obj)
for obj in elements:
    for m in obj.get("members", []):
        if m["type"] == "way" and m["ref"] in ways:
            m["geometry"] = ways[m["ref"]]["geometry"]
(DEST / "osm-raw.json").write_text(json.dumps({"elements":elements}, ensure_ascii=False), encoding="utf-8")
(DEST / "osm-source.json").write_text(json.dumps({"endpoint":URL,"retrievedAt":datetime.now(timezone.utc).isoformat(),"bboxSouthWestNorthEast":[29.558,106.566,29.573,106.584],"sha256":hashlib.sha256(raw).hexdigest(),"attribution":"© OpenStreetMap contributors","license":"ODbL 1.0","licenseUrl":"https://www.openstreetmap.org/copyright","note":"One-time cached local modeling excerpt. Overpass endpoints returned 502/406 and 500; used documented read-only OSM bbox API."},ensure_ascii=False,indent=2),encoding="utf-8")
buildings=[e for e in elements if "building" in e["tags"]]
print(json.dumps({"bytes":len(raw),"elements":len(elements),"buildings":len(buildings),"height":sum("height" in e["tags"] for e in buildings),"levels":sum("building:levels" in e["tags"] for e in buildings),"water":[{"id":e["id"],"type":e["type"],"tags":e["tags"],"points":len(e.get("geometry",[])),"members":len(e.get("members",[]))} for e in elements if e["tags"].get("natural")=="water"],"landmarks":[{"id":e["id"],"type":e["type"],"tags":e["tags"]} for e in elements if any(s in e["tags"].get("name","") for s in ["洪崖洞","千厮门","千廝門"])]},ensure_ascii=False))
