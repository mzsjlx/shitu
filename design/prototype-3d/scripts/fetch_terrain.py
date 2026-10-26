"""Cache the four or fewer required public Terrarium terrain tiles."""
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

DEST=Path(__file__).resolve().parents[1]/"data"/"terrain"
DEST.mkdir(parents=True,exist_ok=True)
ZOOM=14
def tile(lon,lat):
    return ((lon+180)/360*2**ZOOM,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**ZOOM)
west,north=tile(106.566,29.573)
east,south=tile(106.584,29.558)
records=[]
for x in range(math.floor(west),math.floor(east)+1):
    for y in range(math.floor(north),math.floor(south)+1):
        url=f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png"
        path=DEST/f"{ZOOM}-{x}-{y}.png"
        if not path.exists():
            with urlopen(Request(url,headers={"User-Agent":"FoodCityLocalDesignStudy/0.1"}),timeout=30) as response:
                path.write_bytes(response.read())
        raw=path.read_bytes()
        records.append({"url":url,"file":path.name,"sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw),"z":ZOOM,"x":x,"y":y})
        print(f"Cached {path.name}: {len(raw)} bytes",flush=True)
(DEST/"source.json").write_text(json.dumps({"retrievedAt":datetime.now(timezone.utc).isoformat(),"registry":"https://registry.opendata.aws/terrain-tiles/","attribution":"Terrain Tiles: Mapzen / Tilezen; SRTM and GMTED2010 courtesy of USGS, ETOPO1 NOAA","licenseAndSources":"https://github.com/tilezen/joerd/blob/master/docs/attribution.md","encoding":"R*256+G+B/256-32768 meters","tiles":records},indent=2),encoding="utf-8")
