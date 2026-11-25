import json
import time
from pathlib import Path

details = [
    ("特厨隋坡", "suipo", "7513669075017501992", "https://v.douyin.com/zsxLVqoTbyA/"),
    ("哇塞几张", "wasaijizhang", "7622980347575192832", "https://v.douyin.com/-_WF3WbflSk/"),
    ("二百者也", "erbaizheye", "7571507105111362862", "https://v.douyin.com/Bp0zkVIOtp4/")
]

summary = []

for author_raw, slug, aweme_id, share_url in details:
    source_id = f"cd-{slug}-{aweme_id}"
    detail_path = Path(f"output/research/chengdu/details/{source_id}.json")
    with open(detail_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    desc = data.get("desc", "").replace("\n", " ").strip()
    create_time = data.get("create_time", 0)
    pub_date = time.strftime("%Y-%m-%d", time.localtime(create_time)) if create_time else ""
    video = data.get("video", {})
    dur = round(video.get("duration", 0) / 1000.0, 2)
    poi = data.get("poi_info", {})
    poi_name = poi.get("poi_name", "") if poi else ""
    author = data.get("author", {}).get("nickname", author_raw)
    
    play_addrs = video.get("play_addr", {}).get("url_list", [])
    if not play_addrs:
        play_addrs = video.get("play_addr_h264", {}).get("url_list", [])
    
    summary.append({
        "sourceId": source_id,
        "author": author,
        "authorSlug": slug,
        "awemeId": aweme_id,
        "title": desc,
        "shareURL": share_url,
        "canonicalURL": f"https://www.douyin.com/video/{aweme_id}",
        "publishedOn": pub_date,
        "durationSeconds": dur,
        "poiName": poi_name,
        "playAddr": play_addrs[0] if play_addrs else ""
    })

with open("output/research/chengdu/batch3_sources_meta.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

for s in summary:
    print(f"[{s['sourceId']}] {s['author']} ({s['publishedOn']}, {s['durationSeconds']}s)")
    print(f"  Title: {s['title']}")
    print(f"  POI: {s['poiName']}")
    print(f"  PlayAddr: {bool(s['playAddr'])}\n")
