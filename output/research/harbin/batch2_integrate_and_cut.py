import json
import subprocess
import hashlib
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
clips_dir = root / "map-base/.local/video-clips"
clips_dir.mkdir(parents=True, exist_ok=True)
posters_assets_base = root / "map-base/assets/video-posters"
posters_assets_base.mkdir(parents=True, exist_ok=True)

vl_path = root / "map-base/data/cities/harbin/video-library.json"
with open(vl_path, "r", encoding="utf-8") as f:
    vl = json.load(f)

b2_path = root / "output/research/harbin/batch2_resolved.json"
b2_items = {it["sourceId"]: it for it in json.load(open(b2_path, encoding="utf-8"))}

def compute_media_key(source_sha, seg_id, start, end, poster_sec):
    payload = json.dumps({
        "source": source_sha,
        "id": seg_id,
        "start": float(start),
        "end": float(end),
        "poster": float(poster_sec),
        "profile": "h264-crf21-aac128-v1"
    }, separators=(',', ':'))
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()[:16]

new_entries = [
    {
        "sourceId": "hb-真探唐仁杰-7293734337541918003",
        "author": "真探唐仁杰",
        "title": "哈尔滨第一顿吃铁锅炖大鹅！这炖的可真是嘎嘎香！",
        "url": "https://www.douyin.com/video/7293734337541918003",
        "shareURL": "https://v.douyin.com/3RgZoXkqkMA/",
        "evidenceNote": "真探唐仁杰哈尔滨探店视频，实地打卡道里区民安街山河屯铁锅炖大鹅总店。",
        "segments": [
            {
                "id": "hb-tangrenjie-shanhetun",
                "name": "山河屯铁锅炖大鹅（民安街总店）",
                "category": "东北铁锅炖 / 炖大鹅",
                "summary": "道里区民安街哈尔滨铁锅炖老字号顶流，鲜嫩大鹅小火柴火慢㸆，汤汁红亮香浓裹满干豆角与玉米贴饼。",
                "addressText": "哈尔滨市道里区民安街29号（近安发桥）",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 16.0,
                "coordinates": [126.609841, 45.7492419],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "民安街与抚顺街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片民安街总店线索采用开放地图对象【民安街】（OSM node 17201）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 17201,
                        "name": "民安街路段",
                        "url": "https://www.openstreetmap.org/node/17201",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-特厨隋坡重新出发-7532707521379699968",
        "author": "特厨隋坡（重新出发版）",
        "title": "特厨探店 |哈尔滨还得排两次队的家常菜馆？—知音酒楼",
        "url": "https://www.douyin.com/video/7532707521379699968",
        "shareURL": "https://v.douyin.com/lMyokdDDk-4/",
        "evidenceNote": "特厨隋坡哈尔滨探店视频，实地排队打卡南岗区辽阳街刘氏知音酒楼，招牌黑椒小滑肉。",
        "segments": [
            {
                "id": "hb-suipo-zhiyinfood",
                "name": "刘氏知音酒楼（辽阳街店）",
                "category": "哈尔滨老菜馆 / 家常菜",
                "summary": "南岗区辽阳街排号传奇家常菜老馆，首创黑椒小滑肉滑嫩香浓，传统老式溜肉段与特色排骨地道醇厚。",
                "addressText": "哈尔滨市南岗区辽阳街84号",
                "start": 5.0,
                "end": 17.0,
                "posterSecond": 6.0,
                "coordinates": [126.6518256, 45.7617805],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "辽阳街街区段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片刘氏知音酒楼线索采用开放地图对象【辽阳街】（OSM node 13018）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 13018,
                        "name": "辽阳街路段",
                        "url": "https://www.openstreetmap.org/node/13018",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-玲子reiko-7607291212181163300",
        "author": "玲子reiko",
        "title": "逛哈尔滨百年菜市场，美食太多吃不下！",
        "url": "https://www.douyin.com/video/7607291212181163300",
        "shareURL": "https://v.douyin.com/IR51xSu1Yac/",
        "evidenceNote": "玲子reiko哈尔滨探店视频，实地打卡道里区尚志大街57号百年老字号道里菜市场室内美食城。",
        "segments": [
            {
                "id": "hb-lingzi-daolishichang",
                "name": "道里菜市场（百年老字号美食城）",
                "category": "百年室内菜市 / 东北名吃聚集地",
                "summary": "道里区尚志大街百年老菜场室内美食天花板，传统烤冷面、现炸油炸糕、老式熟食红肠与格瓦斯一网打尽。",
                "addressText": "哈尔滨市道里区尚志大街57号",
                "start": 24.0,
                "end": 36.0,
                "posterSecond": 25.0,
                "coordinates": [126.6161925, 45.7725128],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "尚志大街道里菜市场门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道里菜市场线索采用开放地图对象【尚志大街】（OSM node 10271）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10271,
                        "name": "尚志大街路段",
                        "url": "https://www.openstreetmap.org/node/10271",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-给我囊次一口-7599605004614756837",
        "author": "给我囊次一口",
        "title": "哈尔滨好吃，但带不走的东西！",
        "url": "https://www.douyin.com/video/7599605004614756837",
        "shareURL": "https://v.douyin.com/RNwPtg8CZag/",
        "evidenceNote": "给我囊次一口哈尔滨探店视频，实地探访道里菜市场百年熟食炸蔬莱等名吃。",
        "segments": [
            {
                "id": "hb-nangci-daolishichang",
                "name": "道里菜市场（百年老字号美食城）",
                "category": "百年室内菜市 / 东北名吃聚集地",
                "summary": "道里区尚志大街百年老菜场室内美食天花板，传统烤冷面、现炸油炸糕、老式熟食红肠与格瓦斯一网打尽。",
                "addressText": "哈尔滨市道里区尚志大街57号",
                "start": 2.0,
                "end": 14.0,
                "posterSecond": 3.0,
                "coordinates": [126.6161925, 45.7725128],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "尚志大街道里菜市场门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道里菜市场线索采用开放地图对象【尚志大街】（OSM node 10271）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10271,
                        "name": "尚志大街路段",
                        "url": "https://www.openstreetmap.org/node/10271",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-刘雨鑫JASON-7460912322115112204",
        "author": "刘雨鑫JASON",
        "title": "黑龙江哈尔滨人气扒肉馆，尝尝怎么样？",
        "url": "https://www.douyin.com/video/7460912322115112204",
        "shareURL": "https://v.douyin.com/uutMMeldDtw/",
        "evidenceNote": "刘雨鑫JASON哈尔滨探店视频，实地打卡老道外南五道街张飞扒肉老店。",
        "segments": [
            {
                "id": "hb-liuyuxin-zhangfeibarou",
                "name": "道外张飞扒肉（南五道街老店）",
                "category": "老道外名吃 / 传统扒肉",
                "summary": "道外百年传统市井老铺，招牌大块扒肉软烂化渣不腻口，配肥肠炒尖椒、扒肉丸子与苏伯汤大米饭堪称绝配。",
                "addressText": "哈尔滨市道外区南五道街208号",
                "start": 11.0,
                "end": 23.0,
                "posterSecond": 13.0,
                "coordinates": [126.637052, 45.7828147],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "老道外南五道街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外老店线索采用开放地图对象【南五道街】（OSM node 5714）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5714,
                        "name": "南五道街路段",
                        "url": "https://www.openstreetmap.org/node/5714",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-特别乌啦啦-7585062675730779427",
        "author": "特别乌啦啦",
        "title": "花356元在哈尔滨吃「饺子」～你的家乡冬至都吃啥",
        "url": "https://www.douyin.com/video/7585062675730779427",
        "shareURL": "https://v.douyin.com/HPIKk-ay2zk/",
        "evidenceNote": "特别乌啦啦哈尔滨冬至探店视频，实地打卡中央大街老字号现包水饺名店。",
        "segments": [
            {
                "id": "hb-wulala-zhongyangjiaozi",
                "name": "喜家德现包水饺（中央大街店）",
                "category": "东北水饺 / 现包水饺",
                "summary": "中央大街百年老街现包东北水饺名店，招牌喜三鲜与酸菜猪肉现包现煮，皮薄馅大热气腾腾。",
                "addressText": "哈尔滨市道里区中央大街步行街",
                "start": 6.0,
                "end": 18.0,
                "posterSecond": 7.0,
                "coordinates": [126.6121826, 45.7750665],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中央大街步行街中段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街现包水饺实录采用开放地图对象【中央大街】（OSM node 8210）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 8210,
                        "name": "中央大街路段",
                        "url": "https://www.openstreetmap.org/node/8210",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "sourceId": "hb-达哥在上海-7419632775109578025",
        "author": "达哥在上海",
        "title": "藏在居民楼子里只有四张桌子的小吃店，竟然是哈尔滨锅包肉天花板？",
        "url": "https://www.douyin.com/video/7419632775109578025",
        "shareURL": "https://v.douyin.com/C68no__udEo/",
        "evidenceNote": "达哥在上海哈尔滨锅包肉探店视频，实地打卡香坊区六顺街老式四张桌居民楼小吃店。",
        "segments": [
            {
                "id": "hb-dage-guobaorou",
                "name": "老式居民楼锅包肉小吃店（香坊区店）",
                "category": "东北传统名菜 / 锅包肉小吃",
                "summary": "香坊老居民楼内仅四张桌子的传奇小铺，老师傅大锅现炸老式糖醋锅包肉，金黄酥脆焦香挂糊，酸甜利口。",
                "addressText": "哈尔滨市香坊区六顺街与三辅三道街附近",
                "start": 7.0,
                "end": 19.0,
                "posterSecond": 13.0,
                "coordinates": [126.6807827, 45.7339784],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "香坊区六顺街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片香坊区老店线索采用开放地图对象【六顺街】（OSM node 22988）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 22988,
                        "name": "六顺街路段",
                        "url": "https://www.openstreetmap.org/node/22988",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2024年视频 · 营业情况待确认"
            }
        ]
    }
]

# Read existing report.json
report_path = root / "map-base/.local/video-clips/report.json"
report_data = {"schemaVersion": 1, "records": []}
if report_path.exists():
    report_data = json.load(open(report_path, encoding="utf-8"))

records_map = {r["id"]: r for r in report_data.get("records", [])}

# Read posters json
posters_harbin_path = root / "map-base/data/cities/harbin/video-posters.json"
posters_harbin = json.load(open(posters_harbin_path, encoding="utf-8"))
posters_global_path = root / "map-base/data/video-posters.json"
posters_global = json.load(open(posters_global_path, encoding="utf-8"))

# Read assets json
assets_harbin_path = root / "map-base/data/cities/harbin/video-library-assets.json"
assets_harbin = json.load(open(assets_harbin_path, encoding="utf-8"))

print(f"=== Encoding clips and posters for {len(new_entries)} new sources ===")

for entry in new_entries:
    sid = entry["sourceId"]
    b2_info = b2_items.get(sid, {})
    sha = b2_info.get("sourceSHA256")
    dur = b2_info.get("durationSeconds", 300)
    pub = b2_info.get("publishedOn", "2026-11-14")
    
    src_mp4 = intake_dir / sid / "source.mp4"
    if not src_mp4.exists():
        print(f"ERROR: missing {src_mp4}")
        continue
        
    source_obj = {
        "id": sid,
        "author": entry["author"],
        "title": entry["title"],
        "url": entry["url"],
        "shareURL": entry["shareURL"],
        "publishedOn": pub,
        "durationSeconds": dur,
        "sourceSHA256": sha,
        "acquisitionStatus": "local-source",
        "evidenceNote": entry["evidenceNote"],
        "segments": entry["segments"]
    }
    
    out_dir = clips_dir / sid
    out_dir.mkdir(parents=True, exist_ok=True)
    poster_dir = posters_assets_base / sid
    poster_dir.mkdir(parents=True, exist_ok=True)
    
    for seg in entry["segments"]:
        seg_id = seg["id"]
        start_sec = seg["start"]
        end_sec = seg["end"]
        clip_dur = end_sec - start_sec
        poster_sec = seg["posterSecond"]
        
        m_key = compute_media_key(sha, seg_id, start_sec, end_sec, poster_sec)
        clip_name = f"{seg_id}-{m_key}.mp4"
        poster_name = f"{seg_id}-{m_key}.jpg"
        
        clip_mp4 = out_dir / clip_name
        tmp_clip = out_dir / f"{seg_id}.tmp.mp4"
        final_poster_jpg = out_dir / poster_name
        
        # 1. Encode clip
        print(f"Encoding {seg_id} ({clip_dur}s) -> {clip_name}...")
        cmd_clip = [
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(start_sec), "-i", str(src_mp4),
            "-t", str(clip_dur),
            "-map", "0:v:0", "-map", "0:a:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p",
            "-threads", "4", "-c:a", "aac", "-b:a", "128k", "-map_metadata", "-1", "-movflags", "+faststart",
            str(tmp_clip)
        ]
        subprocess.run(cmd_clip, check=True)
        if clip_mp4.exists():
            clip_mp4.unlink()
        tmp_clip.rename(clip_mp4)
        
        # 2. Extract poster
        print(f"Extracting poster -> {poster_name}...")
        cmd_poster = [
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(poster_sec), "-i", str(src_mp4),
            "-frames:v", "1", "-q:v", "3",
            str(final_poster_jpg)
        ]
        subprocess.run(cmd_poster, check=True)
        
        # Copy to public assets
        public_poster_file = poster_dir / poster_name
        shutil.copyfile(final_poster_jpg, public_poster_file)
        
        # Calculate hashes
        clip_bytes = clip_mp4.read_bytes()
        clip_sha = hashlib.sha256(clip_bytes).hexdigest()
        poster_bytes = final_poster_jpg.read_bytes()
        poster_sha = hashlib.sha256(poster_bytes).hexdigest()
        
        # Save record for report.json
        records_map[seg_id] = {
            "id": seg_id,
            "sourceId": sid,
            "mediaKey": m_key,
            "sourceSHA256": sha,
            "start": start_sec,
            "end": end_sec,
            "posterSecond": poster_sec,
            "clip": clip_name,
            "poster": poster_name,
            "clipBytes": len(clip_bytes),
            "posterBytes": len(poster_bytes),
            "clipSHA256": clip_sha,
            "posterSHA256": poster_sha
        }
        
        # Update posters json
        rel_poster_path = f"assets/video-posters/{sid}/{poster_name}"
        poster_dict_entry = {
            "sourceId": sid,
            "sourceSHA256": sha,
            "mediaKey": m_key,
            "path": rel_poster_path,
            "sha256": poster_sha,
            "bytes": len(poster_bytes)
        }
        
        posters_harbin["segments"][seg_id] = poster_dict_entry
        posters_global["segments"][seg_id] = poster_dict_entry
        
        # Update assets json
        assets_harbin["segments"][seg_id] = {
            "clip": f"./media/videos/{sid}/{clip_name}",
            "poster": f"./media/videos/{sid}/{poster_name}",
            "durationSeconds": clip_dur
        }
        
    vl["sources"] = [s for s in vl["sources"] if s["id"] != sid]
    vl["sources"].append(source_obj)

# Update rights scope
vl["rights"]["scope"] = "哈尔滨探店视频来源由用户提供，经确认已获作者特别乌啦啦、小珍来咯…、橘子公主、澳仔、刘雨鑫JASON、盗月社食遇记、面条人、PP超能炫、特厨隋坡（重新出发版）、真探唐仁杰、玲子reiko、给我囊次一口、达哥在上海允许剪辑并在食途网站使用；保留原平台、原作者与原作品链接。"
vl["preparedOn"] = "2026-11-14"

# Write back all JSONs
with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

report_data["records"] = list(records_map.values())
report_data["preparedAt"] = "2026-11-14T14:40:00.000Z"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report_data, f, ensure_ascii=False, indent=2)

with open(posters_harbin_path, "w", encoding="utf-8") as f:
    json.dump(posters_harbin, f, ensure_ascii=False, indent=2)

with open(posters_global_path, "w", encoding="utf-8") as f:
    json.dump(posters_global, f, ensure_ascii=False, indent=2)

with open(assets_harbin_path, "w", encoding="utf-8") as f:
    json.dump(assets_harbin, f, ensure_ascii=False, indent=2)

print(f"\n==========================================")
print(f"SUCCESS! Harbin now has {len(vl['sources'])} sources and {sum(len(s['segments']) for s in vl['sources'])} segments.")
