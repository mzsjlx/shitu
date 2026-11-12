import json, math
from pathlib import Path

def circle_coords(cx, cy, r_deg_lon, r_deg_lat, steps=16):
    coords = []
    for i in range(steps):
        angle = 2 * math.pi * i / steps
        x = cx + r_deg_lon * math.cos(angle)
        y = cy + r_deg_lat * math.sin(angle)
        coords.append([round(x, 7), round(y, 7)])
    coords.append(coords[0])
    return coords

def arc_coords(cx, cy, r_deg_lon, r_deg_lat, start_deg, end_deg, steps=12):
    coords = []
    for i in range(steps + 1):
        angle = math.radians(start_deg + (end_deg - start_deg) * i / steps)
        x = cx + r_deg_lon * math.cos(angle)
        y = cy + r_deg_lat * math.sin(angle)
        coords.append([round(x, 7), round(y, 7)])
    return coords

def rect_coords(cx, cy, half_w, half_h):
    return [[
        [round(cx - half_w, 7), round(cy - half_h, 7)],
        [round(cx + half_w, 7), round(cy - half_h, 7)],
        [round(cx + half_w, 7), round(cy + half_h, 7)],
        [round(cx - half_w, 7), round(cy + half_h, 7)],
        [round(cx - half_w, 7), round(cy - half_h, 7)]
    ]]

features = []

# --- 1. 圣索菲亚大教堂 (Saint Sophia Cathedral) ---
# Coordinates: [126.62255, 45.76878]
scx, scy = 126.62255, 45.76878
m_to_lon = 1.0 / (111320 * math.cos(math.radians(scy)))
m_to_lat = 1.0 / 110540

# Sophia Plaza Apron
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-plaza",
        "name": "圣索菲亚广场 · 铺装广场",
        "type": "landmark",
        "height": 0.6,
        "min_height": 0,
        "color": "#ded8cb",
        "flat_color": "#cfc7b8"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(scx, scy, 75 * m_to_lon, 55 * m_to_lat)}
})

# Cathedral Main Hall (Greek Cross nave body)
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-nave",
        "name": "圣索菲亚大教堂 · 红砖主殿",
        "type": "landmark",
        "height": 22,
        "min_height": 0,
        "color": "#a84332",
        "flat_color": "#8c3527"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(scx, scy, 22 * m_to_lon, 14 * m_to_lat)}
})

# Cathedral Cross Transept (cross wing)
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-transept",
        "name": "圣索菲亚大教堂 · 十字翼殿",
        "type": "landmark",
        "height": 20,
        "min_height": 0,
        "color": "#a84332",
        "flat_color": "#8c3527"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(scx, scy, 14 * m_to_lon, 22 * m_to_lat)}
})

# Central Octagonal Drum
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-drum",
        "name": "圣索菲亚大教堂 · 中央鼓座",
        "type": "landmark",
        "height": 34,
        "min_height": 22,
        "color": "#9e3e2e",
        "flat_color": "#802e20"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(scx, scy, 8.5 * m_to_lon, 8.5 * m_to_lat, steps=8)]}
})

# Central Emerald Onion Dome (洋葱头主穹顶)
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-dome-lower",
        "name": "圣索菲亚大教堂 · 拜占庭洋葱头绿穹顶（基座）",
        "type": "landmark",
        "height": 43,
        "min_height": 34,
        "color": "#20593f",
        "flat_color": "#16422e"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(scx, scy, 9.8 * m_to_lon, 9.8 * m_to_lat, steps=16)]}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-dome-upper",
        "name": "圣索菲亚大教堂 · 拜占庭洋葱头绿穹顶（尖顶）",
        "type": "landmark",
        "height": 49,
        "min_height": 43,
        "color": "#184933",
        "flat_color": "#113826"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(scx, scy, 6.0 * m_to_lon, 6.0 * m_to_lat, steps=12)]}
})

# Top Golden Spire & Cross
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-cross",
        "name": "圣索菲亚大教堂 · 穹顶金十字架",
        "type": "landmark",
        "height": 53.5,
        "min_height": 49,
        "color": "#d4af37",
        "flat_color": "#ba9525"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(scx, scy, 1.5 * m_to_lon, 1.5 * m_to_lat, steps=8)]}
})

# West Belfry / Tent-roof Bell Tower (钟楼)
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-belfry-body",
        "name": "圣索菲亚大教堂 · 钟楼殿身",
        "type": "landmark",
        "height": 26,
        "min_height": 0,
        "color": "#a84332",
        "flat_color": "#8c3527"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(scx - 18 * m_to_lon, scy, 6 * m_to_lon, 6 * m_to_lat)}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-sophia-belfry-tent",
        "name": "圣索菲亚大教堂 · 钟楼帐篷顶",
        "type": "landmark",
        "height": 36,
        "min_height": 26,
        "color": "#1c4e37",
        "flat_color": "#133d2a"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(scx - 18 * m_to_lon, scy, 4.5 * m_to_lon, 4.5 * m_to_lat, steps=8)]}
})

# --- 2. 防洪纪念塔与斯大林公园 (Flood Control Monument & Stalin Park) ---
# Coordinates: [126.61860, 45.77970]
mcx, mcy = 126.61860, 45.77970
mm_to_lon = 1.0 / (111320 * math.cos(math.radians(mcy)))
mm_to_lat = 1.0 / 110540

# Riverside Promenade Plaza
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-flood-plaza",
        "name": "哈尔滨市人民防洪胜利纪念塔 · 亲水喷泉广场",
        "type": "landmark",
        "height": 1.2,
        "min_height": 0,
        "color": "#ded9cc",
        "flat_color": "#cfc8b9"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(mcx, mcy, 45 * mm_to_lon, 35 * mm_to_lat)}
})

# Semicircular Roman Colonnade (半圆罗马柱廊)
inner_arc = arc_coords(mcx, mcy + 3 * mm_to_lat, 22 * mm_to_lon, 22 * mm_to_lat, 200, 340, steps=16)
outer_arc = arc_coords(mcx, mcy + 3 * mm_to_lat, 26 * mm_to_lon, 26 * mm_to_lat, 340, 200, steps=16)
colonnade_coords = [inner_arc + outer_arc + [inner_arc[0]]]

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-flood-colonnade",
        "name": "防洪纪念塔 · 半圆古罗马列柱回廊",
        "type": "landmark",
        "height": 7.5,
        "min_height": 0,
        "color": "#ece6d8",
        "flat_color": "#ded6c5"
    },
    "geometry": {"type": "Polygon", "coordinates": colonnade_coords}
})

# Central Monument Base
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-flood-tower-base",
        "name": "防洪纪念塔 · 阶梯圆坛基座",
        "type": "landmark",
        "height": 3.8,
        "min_height": 0,
        "color": "#d5cdc0",
        "flat_color": "#c4baa9"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(mcx, mcy, 7.5 * mm_to_lon, 7.5 * mm_to_lat, steps=16)]}
})

# Central Column Shaft
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-flood-tower-shaft",
        "name": "防洪纪念塔 · 圆柱塔身",
        "type": "landmark",
        "height": 22.5,
        "min_height": 3.8,
        "color": "#e2dcd2",
        "flat_color": "#d2cac0"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(mcx, mcy, 2.4 * mm_to_lon, 2.4 * mm_to_lat, steps=12)]}
})

# Monument Top Bronze Sculpture
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-flood-tower-statue",
        "name": "防洪纪念塔 · 塔顶凯旋雕像",
        "type": "landmark",
        "height": 24.5,
        "min_height": 22.5,
        "color": "#9e6f3b",
        "flat_color": "#825727"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(mcx, mcy, 2.8 * mm_to_lon, 2.8 * mm_to_lat, steps=8)]}
})

# --- 3. 马迭尔宾馆与中央大街 (Modern Hotel & Central Avenue) ---
# Coordinates: [126.61780, 45.77350]
hcx, hcy = 126.61780, 45.77350
hm_to_lon = 1.0 / (111320 * math.cos(math.radians(hcy)))
hm_to_lat = 1.0 / 110540

# Central Avenue Pedestrian Street Pavement
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-central-avenue-pavement",
        "name": "中央大街 · 百年面包石步行街地面",
        "type": "landmark",
        "height": 0.2,
        "min_height": 0,
        "color": "#ded9ce",
        "flat_color": "#ccc5b8"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx, hcy, 10 * hm_to_lon, 450 * hm_to_lat)}
})

# Modern Hotel Main Body (3-story Art Nouveau)
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-modern-hotel-main",
        "name": "马迭尔宾馆 · 主楼新艺术运动建筑",
        "type": "landmark",
        "height": 18,
        "min_height": 0,
        "color": "#e9dfcb",
        "flat_color": "#d9cdb4"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx + 22 * hm_to_lon, hcy, 16 * hm_to_lon, 28 * hm_to_lat)}
})

# Modern Hotel Famous 2nd-floor Balcony
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-modern-hotel-balcony",
        "name": "马迭尔宾馆 · 标志性二楼音乐阳台",
        "type": "landmark",
        "height": 8.5,
        "min_height": 6.8,
        "color": "#383f3d",
        "flat_color": "#282d2c"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx + 6 * hm_to_lon, hcy, 2.5 * hm_to_lon, 7 * hm_to_lat)}
})

# Modern Hotel Mansard Roof
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-modern-hotel-roof",
        "name": "马迭尔宾馆 · 孟莎式法式屋顶",
        "type": "landmark",
        "height": 22.5,
        "min_height": 18,
        "color": "#54605e",
        "flat_color": "#434d4b"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx + 22 * hm_to_lon, hcy, 13 * hm_to_lon, 24 * hm_to_lat)}
})

# Huamei Western Restaurant & Adjacent European Blocks
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-huamei-block",
        "name": "华梅西餐厅与中央大街西侧折衷主义立面",
        "type": "landmark",
        "height": 17,
        "min_height": 0,
        "color": "#e3d8c3",
        "flat_color": "#d2c5ae"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx - 22 * hm_to_lon, hcy - 15 * hm_to_lat, 15 * hm_to_lon, 32 * hm_to_lat)}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-huamei-parapet",
        "name": "中央大街欧式建筑山花女儿墙",
        "type": "landmark",
        "height": 19.5,
        "min_height": 17,
        "color": "#d4c7af",
        "flat_color": "#c0b196"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(hcx - 22 * hm_to_lon, hcy - 15 * hm_to_lat, 13 * hm_to_lon, 30 * hm_to_lat)}
})

# --- 4. 道外中华巴洛克历史文化街区 (Daowai Chinese Baroque District) ---
# Coordinates: [126.65350, 45.78920]
bcx, bcy = 126.65350, 45.78920
bm_to_lon = 1.0 / (111320 * math.cos(math.radians(bcy)))
bm_to_lat = 1.0 / 110540

# Street-facing Baroque Façades along Jingyu St
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-baroque-front-north",
        "name": "中华巴洛克历史街区 · 靖宇街北侧中西合璧立面",
        "type": "landmark",
        "height": 13.5,
        "min_height": 0,
        "color": "#d1c6b4",
        "flat_color": "#beaf9a"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(bcx, bcy + 25 * bm_to_lat, 55 * bm_to_lon, 8 * bm_to_lat)}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-baroque-front-south",
        "name": "中华巴洛克历史街区 · 靖宇街南侧中西合璧立面",
        "type": "landmark",
        "height": 13.5,
        "min_height": 0,
        "color": "#d1c6b4",
        "flat_color": "#beaf9a"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(bcx, bcy - 25 * bm_to_lat, 55 * bm_to_lon, 8 * bm_to_lat)}
})

# Baroque Quadrangle Courtyards (4 authentic courtyards with inner open yards)
for idx, (ox, oy) in enumerate([(-28, 48), (28, 48), (-28, -48), (28, -48)]):
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"hb-baroque-yard-{idx+1}",
            "name": f"中华巴洛克传统合院院落 {idx+1} 号（老鼎丰/张包铺邻近）",
            "type": "landmark",
            "height": 9.5,
            "min_height": 0,
            "color": "#a89f92",
            "flat_color": "#8c8274"
        },
        "geometry": {"type": "Polygon", "coordinates": rect_coords(bcx + ox * bm_to_lon, bcy + oy * bm_to_lat, 18 * bm_to_lon, 14 * bm_to_lat)}
    })
    # Courtyard Traditional Eaves Ridge
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"hb-baroque-ridge-{idx+1}",
            "name": f"巴洛克四合院中式硬山坡顶 {idx+1}",
            "type": "landmark",
            "height": 11.5,
            "min_height": 9.5,
            "color": "#4e5458",
            "flat_color": "#3d4246"
        },
        "geometry": {"type": "Polygon", "coordinates": rect_coords(bcx + ox * bm_to_lon, bcy + oy * bm_to_lat, 14 * bm_to_lon, 10 * bm_to_lat)}
    })

# --- 5. 哈尔滨火车站 (Harbin Railway Station) ---
# Coordinates: [126.62680, 45.75950]
rcx, rcy = 126.62680, 45.75950
rm_to_lon = 1.0 / (111320 * math.cos(math.radians(rcy)))
rm_to_lat = 1.0 / 110540

# Station Main Passenger Terminal Hall
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-station-concourse",
        "name": "哈尔滨站 · 新艺术运动复古主站房",
        "type": "landmark",
        "height": 22,
        "min_height": 0,
        "color": "#f0e6d2",
        "flat_color": "#dfd4bd"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(rcx, rcy, 65 * rm_to_lon, 22 * rm_to_lat)}
})

# Station Curved Green Roof Vaults
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-station-vaults",
        "name": "哈尔滨站 · 浅绿拱券铜屋顶",
        "type": "landmark",
        "height": 27,
        "min_height": 22,
        "color": "#30624c",
        "flat_color": "#234d3b"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(rcx, rcy, 58 * rm_to_lon, 16 * rm_to_lat)}
})

# Station Iconic Central Clock Tower
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-station-clocktower",
        "name": "哈尔滨站 · 中央复古钟楼",
        "type": "landmark",
        "height": 38,
        "min_height": 22,
        "color": "#d9cdb8",
        "flat_color": "#c5b79f"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(rcx, rcy + 10 * rm_to_lat, 8 * rm_to_lon, 8 * rm_to_lat)}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-station-spire",
        "name": "哈尔滨站 · 钟楼尖塔",
        "type": "landmark",
        "height": 43,
        "min_height": 38,
        "color": "#265440",
        "flat_color": "#1c4030"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(rcx, rcy + 10 * rm_to_lat, 4 * rm_to_lon, 4 * rm_to_lat, steps=8)]}
})

# --- 6. 秋林公司大楼 (Qiulin Building) ---
# Coordinates: [126.64160, 45.75820]
qcx, qcy = 126.64160, 45.75820
qm_to_lon = 1.0 / (111320 * math.cos(math.radians(qcy)))
qm_to_lat = 1.0 / 110540

# Qiulin Main Commercial Block
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-qiulin-main",
        "name": "秋林公司大楼 · 百年巴洛克商业总店",
        "type": "landmark",
        "height": 22,
        "min_height": 0,
        "color": "#ece2cf",
        "flat_color": "#dbcfb9"
    },
    "geometry": {"type": "Polygon", "coordinates": rect_coords(qcx, qcy, 28 * qm_to_lon, 28 * qm_to_lat)}
})

# Corner Cylindrical Rotunda with Big Green Dome
features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-qiulin-dome-rotunda",
        "name": "秋林公司 · 转角绿穹顶鼓座",
        "type": "landmark",
        "height": 28,
        "min_height": 22,
        "color": "#ded2bc",
        "flat_color": "#cbbeab"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(qcx + 16 * qm_to_lon, qcy + 16 * qm_to_lat, 9 * qm_to_lon, 9 * qm_to_lat, steps=16)]}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-qiulin-dome",
        "name": "秋林公司 · 标志性铜绿大圆顶",
        "type": "landmark",
        "height": 34,
        "min_height": 28,
        "color": "#1f563e",
        "flat_color": "#174431"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(qcx + 16 * qm_to_lon, qcy + 16 * qm_to_lat, 8 * qm_to_lon, 8 * qm_to_lat, steps=16)]}
})

features.append({
    "type": "Feature",
    "properties": {
        "id": "hb-qiulin-cupola",
        "name": "秋林公司 · 穹顶采光亭尖塔",
        "type": "landmark",
        "height": 37.5,
        "min_height": 34,
        "color": "#d4af37",
        "flat_color": "#b89528"
    },
    "geometry": {"type": "Polygon", "coordinates": [circle_coords(qcx + 16 * qm_to_lon, qcy + 16 * qm_to_lat, 2.5 * qm_to_lon, 2.5 * qm_to_lat, steps=8)]}
})

geojson = {
    "type": "FeatureCollection",
    "features": features
}

out_path = Path("map-base/data/cities/harbin/harbin-buildings-detail.geojson")
out_path.write_text(json.dumps(geojson, ensure_ascii=False, indent=2), encoding="utf8")
print(f"Successfully generated {len(features)} 3D landmark features in {out_path}!")
