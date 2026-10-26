"""Prepare sourced planar geometry and terrain for an offline Three.js study.

XY in the downloaded data is WGS84. The scene uses a local tangent approximation
in metres: +X east, +Z south. This is not a navigation dataset.
"""
import json
import math
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/".python-packages"))
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union, triangulate

DATA=ROOT/"data"
OUT=ROOT/"dist"/"data"
OUT.mkdir(parents=True,exist_ok=True)
elements=json.loads((DATA/"osm-raw.json").read_text(encoding="utf8"))["elements"]
by_id={(e["type"],e["id"]):e for e in elements}
ORIGIN=[106.5752,29.5652]
SCALE=math.pi*6378137/180
COS=math.cos(math.radians(ORIGIN[1]))
def project(lon,lat): return ((lon-ORIGIN[0])*SCALE*COS,(ORIGIN[1]-lat)*SCALE)
def unproject(x,z): return (ORIGIN[0]+x/SCALE/COS,ORIGIN[1]-z/SCALE)
def coords(element): return [project(p["lon"],p["lat"]) for p in element.get("geometry",[])]
left,top=project(106.566,29.573)
right,bottom=project(106.584,29.558)
bounds=box(left,top,right,bottom)
def parts(shape,kind="Polygon"):
    if shape.is_empty:return []
    if shape.geom_type==kind:return [shape]
    return [p for p in getattr(shape,"geoms",[]) if p.geom_type==kind and not p.is_empty]
def rings(p): return [[[round(x,2),round(z,2)] for x,z in ring.coords] for ring in [p.exterior,*p.interiors]]

water_shapes=[]
source_water=[]
for e in elements:
    t=e["tags"]
    if t.get("natural")!="water":continue
    if e["type"]=="way" and len(coords(e))>=4:
        water_shapes.append(Polygon(coords(e)).buffer(0))
        source_water.append(f'way/{e["id"]}')
    elif e["type"]=="relation":
        outer=[];inner=[]
        for m in e.get("members",[]):
            c=coords(m)
            if len(c)>=4 and c[0]==c[-1]:
                (inner if m.get("role")=="inner" else outer).append(Polygon(c).buffer(0))
        if outer:
            water_shapes.append(unary_union(outer).difference(unary_union(inner)))
            source_water.append(f'relation/{e["id"]}')
water=unary_union(water_shapes).intersection(bounds).buffer(0)
land=bounds.difference(water)

terrain_meta=json.loads((DATA/"terrain"/"source.json").read_text())
tiles={}
for rec in terrain_meta["tiles"]:
    a=np.asarray(Image.open(DATA/"terrain"/rec["file"]).convert("RGB"),dtype=np.float64)
    tiles[(rec["x"],rec["y"])]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
def elevation(x,z):
    lon,lat=unproject(x,z)
    tx=(lon+180)/360*16384
    ty=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*16384
    ix,iy=math.floor(tx),math.floor(ty)
    tile=tiles[(ix,iy)]
    px,py=min(255,(tx-ix)*256),min(255,(ty-iy)*256)
    x0,y0=math.floor(px),math.floor(py)
    x1,y1=min(255,x0+1),min(255,y0+1)
    fx,fy=px-x0,py-y0
    return float((tile[y0,x0]*(1-fx)+tile[y0,x1]*fx)*(1-fy)+(tile[y1,x0]*(1-fx)+tile[y1,x1]*fx)*fy)
samples=[elevation(x,z) for x in np.linspace(left+5,right-5,35) for z in np.linspace(top+5,bottom-5,35) if water.contains(Point(x,z)) and water.boundary.distance(Point(x,z))>65]
water_level=round(float(np.median(samples)),2)
def ground(x,z): return max(1.8,elevation(x,z)-water_level)

N=112
gx=np.linspace(left+.001,right-.001,N+1)
gz=np.linspace(top+.001,bottom-.001,N+1)
terrain_positions=[];terrain_indices=[];vertex_lookup={}
def vertex(x,z):
    key=(round(x,3),round(z,3))
    if key not in vertex_lookup:
        vertex_lookup[key]=len(terrain_positions)//3
        terrain_positions.extend([round(x,2),round(ground(x,z),2),round(z,2)])
    return vertex_lookup[key]
def add_triangle(c):
    # Reverse winding in the XZ plane so normals point upward.
    idx=[vertex(x,z) for x,z in c[:3]]
    cross=(c[1][0]-c[0][0])*(c[2][1]-c[0][1])-(c[1][1]-c[0][1])*(c[2][0]-c[0][0])
    terrain_indices.extend(idx[::-1] if cross>0 else idx)
for iz in range(N):
    for ix in range(N):
        x0,x1=gx[ix],gx[ix+1];z0,z1=gz[iz],gz[iz+1]
        cell=box(x0,z0,x1,z1)
        if land.contains(cell):
            add_triangle([(x0,z0),(x1,z0),(x1,z1)])
            add_triangle([(x0,z0),(x1,z1),(x0,z1)])
        elif land.intersects(cell):
            for p in parts(cell.intersection(land)):
                for tri in triangulate(p):
                    if p.covers(tri.representative_point()):add_triangle(list(tri.exterior.coords))

height_grid=[[round(ground(float(x),float(z)),2) for x in gx] for z in gz]
building_list=[];building_shapes=[];height_stats={"height":0,"levels":0,"estimated":0}
landmark=None
for e in elements:
    if e["type"]!="way" or "building" not in e["tags"]:continue
    c=coords(e)
    if len(c)<4:continue
    p=Polygon(c).buffer(0)
    if p.is_empty or not p.intersects(bounds):continue
    if e["tags"].get("layer","")=="-1" or e["tags"].get("location")=="underground":continue
    for poly in parts(p.intersection(bounds)):
        if poly.area<30:continue
        t=e["tags"]
        def number(s):
            try:return float(str(s).replace("m","").split(";")[0].strip())
            except (TypeError,ValueError):return None
        h=number(t.get("height"));levels=number(t.get("building:levels"))
        if h is not None:quality="height"
        elif levels is not None:h=levels*3.3;quality="levels"
        else:
            quality="estimated";seed=(e["id"]*2654435761%1000)/1000
            h=(18+int(seed*9)*3.3) if poly.area<650 else (30+int(seed*17)*3.3)
            if t.get("building") in ["garages","garage","roof"]:h=4
        height_stats[quality]+=1
        cx,cz=poly.centroid.coords[0]
        ys=[ground(min(right-.01,max(left+.01,x)),min(bottom-.01,max(top+.01,z))) for x,z in list(poly.exterior.coords)]
        record={"id":e["id"],"name":t.get("name",""),"rings":rings(poly),"height":round(min(330,max(3,h)),2),"heightBasis":quality,"base":round(max(ys),2),"minGround":round(min(ys),2),"center":[round(cx,2),round(cz,2)],"kind":t.get("building"),"source":f'https://www.openstreetmap.org/way/{e["id"]}'}
        if e["id"]==939578294:
            record["orientedBounds"]=[[round(x,2),round(z,2)] for x,z in poly.minimum_rotated_rectangle.exterior.coords]
            landmark=record
        else:building_list.append(record)
        building_shapes.append(poly)

road_list=[]
for e in elements:
    t=e["tags"];c=coords(e)
    if e["type"]!="way" or "highway" not in t or len(c)<2:continue
    if t.get("tunnel") in ["yes","building_passage"] or t.get("location")=="underground" or t.get("indoor")=="yes":continue
    if t["highway"] in ["corridor","construction","elevator"]:continue
    line=LineString(c).intersection(bounds)
    for segment in parts(line,"LineString"):
        if segment.length<3:continue
        points=[]
        steps=max(2,math.ceil(segment.length/8)+1)
        for v in np.linspace(0,segment.length,steps):
            x,z=segment.interpolate(v).coords[0]
            x=min(right-.01,max(left+.01,x));z=min(bottom-.01,max(top+.01,z))
            points.append([round(x,2),round(ground(x,z)+.38,2),round(z,2)])
        road_list.append({"id":e["id"],"name":t.get("name",""),"type":t["highway"],"bridge":t.get("bridge")=="yes","layer":t.get("layer","0"),"access":t.get("access",""),"points":points})

parks=[]
for e in elements:
    t=e["tags"];c=coords(e)
    if e["type"]!="way" or len(c)<4 or c[0]!=c[-1]:continue
    if t.get("landuse") not in ["forest","grass","recreation_ground"] and t.get("leisure") not in ["park","garden"]:continue
    for p in parts(Polygon(c).buffer(0).intersection(land)):
        parks.append({"id":e["id"],"rings":rings(p)})

# Decorative tree placements stay on sourced park areas, roadside or riverbank
# land, outside building footprints. Density is art direction, not a tree survey.
building_union=unary_union(building_shapes).buffer(3)
street_union=unary_union([LineString([(p[0],p[2]) for p in r["points"]]).buffer(6 if r["type"] in ["primary","secondary"] else 3) for r in road_list])
park_union=unary_union([Polygon(p["rings"][0],p["rings"][1:]) for p in parks])
rng=np.random.default_rng(7619)
trees=[]
for _ in range(65000):
    x=float(rng.uniform(left+15,right-15));z=float(rng.uniform(top+15,bottom-15));p=Point(x,z)
    if not land.contains(p) or building_union.contains(p) or street_union.contains(p):continue
    in_park=park_union.contains(p)
    near_road=street_union.distance(p)<24
    shore=water.boundary.distance(p)<75
    if not (in_park or near_road or shore):continue
    if not in_park and rng.random()>.68:continue
    trees.append([round(x,2),round(ground(x,z),2),round(z,2),round(float(rng.uniform(5.5,9.5)),2)])
    if len(trees)>=6200:break

bridge=by_id[("way",1257167362)]
metadata={"originLonLat":ORIGIN,"coordinateSystem":"WGS84 -> local metres, X east, Y up, Z south","bounds":[round(left,2),round(top,2),round(right,2),round(bottom,2)],"waterDatumMetres":water_level,"waterDatumNote":"Median DEM samples >65m inside mapped river, fixed visual datum; not current river level.","buildings":len(building_list)+bool(landmark),"heightBasis":height_stats,"roadSegments":len(road_list),"trees":len(trees),"terrainVertices":len(terrain_positions)//3,"terrainTriangles":len(terrain_indices)//3,"waterSourceIds":source_water,"limitations":["OSM completeness and timestamps vary; not surveying data.","Unmapped building heights are deterministic style estimates; estimated feature IDs are preserved.","The Hongyadong and Qiansimen superstructures are custom approximate models, not scans.","Tree placements and windows are decorative, not inventory data.","River level and bridge deck heights are visual estimates; not current hydrology or bridge survey.","No navigation or real restaurant attribution is implied."]}
metadata["limitations"].extend([
    "The coarse DEM is lowered within the Hongyadong oriented bounding rectangle in the renderer to fit the terraced landmark; this is a visual correction, not a terrain survey.",
    "Decorative lower facade windows continue across visible foundation walls; they do not verify real basement floors.",
    "Bridge and footpath levels are incomplete; drawn surfaces are not a routable pedestrian graph.",
    "Landscaping density, shrubs, lamps, vehicles and boats are decorative styling, not real-time or surveyed features.",
])
result={"metadata":metadata,"terrain":{"positions":terrain_positions,"indices":terrain_indices,"grid":height_grid,"nx":N+1,"nz":N+1},"water":[rings(p) for p in parts(water)],"buildings":building_list,"roads":road_list,"parks":parks,"trees":trees,"landmark":landmark,"bridge":{"id":bridge["id"],"footprint":coords(bridge),"south":project(106.57648,29.56524),"north":project(106.57328,29.57260),"superstructureBasis":"Approximate styling aligned to sourced bridge axis and footprint."}}
(OUT/"city.json").write_text(json.dumps(result,ensure_ascii=False,separators=(",",":")),encoding="utf8")
(DATA/"quality-report.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding="utf8")
print(json.dumps({**metadata,"landmark":landmark,"bytes":(OUT/"city.json").stat().st_size},ensure_ascii=False))
