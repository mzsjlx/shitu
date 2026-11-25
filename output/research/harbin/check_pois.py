import urllib.request
import json
from pathlib import Path

out_json = Path("output/research/harbin/batch7_resolved.json")
with open(out_json, "r", encoding="utf-8") as f:
    items = json.load(f)

for it in items:
    aid = it.get("awemeId")
    author = it.get("author")
    idx = it.get("index")
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aid}&aid=6383&device_platform=web"
    req = urllib.request.Request(endpoint, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            detail = data.get("aweme_detail", {})
            poi = detail.get("poi_info", {})
            poi_name = poi.get("poi_name", "")
            addr = poi.get("address_info", {}).get("simple_addr", "")
            lat = poi.get("latitude", "")
            lng = poi.get("longitude", "")
            print(f"[{idx}] {author} -> POI: '{poi_name}', Addr: '{addr}', Coords: [{lng}, {lat}]")
    except Exception as e:
        print(f"[{idx}] {author} -> err: {e}")
