import json
import urllib.request
import hashlib
import time
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

with open(root / "output/research/harbin/batch1_resolved.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Priority sources to download first for initial loop
# 1: 盗月社食遇记 (7599195778485161252)
# 2: 特别乌啦啦 (7585934292711132467)
# 5: 刘雨鑫JASON (7464616074248555828)

def download_source(item):
    source_id = item["sourceId"]
    # Standardize source_id format: hb-author-awemeId
    author_slug = {
        "盗月社食遇记": "daoyueshe",
        "特别乌啦啦": "wulala",
        "澳仔": "aozai",
        "小豪饿了": "xiaohao",
        "刘雨鑫JASON": "liuyuxin",
        "PP超能炫": "ppchaonengxuan",
        "面条人": "miantiaoren",
        "庞师不是师": "pangshi",
        "董春辉": "dongchunhui",
        "小珍来咯…": "xiaozhen",
        "王宁": "wangning",
        "芋泥啵啵🍯": "yunibobo",
        "橘子公主": "juzigongzhu",
        "一条大肥鹅": "yitiaodafeie"
    }.get(item["author"], "author")
    
    clean_source_id = f"hb-{author_slug}-{item['awemeId']}"
    item["sourceId"] = clean_source_id
    
    target_dir = intake_dir / clean_source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = target_dir / "source.mp4"
    
    print(f"\n[{item['index']}] Downloading {item['author']} ({clean_source_id})...")
    print(f"    Title: {item['title']}")
    print(f"    Target: {target_mp4}")
    
    if target_mp4.exists() and target_mp4.stat().st_size > 1000000:
        raw = target_mp4.read_bytes()
        sha256 = hashlib.sha256(raw).hexdigest()
        print(f"    Already exists ({len(raw)} bytes), SHA256: {sha256}")
        item["sourceSHA256"] = sha256
        item["fileSize"] = len(raw)
        return item
    
    download_url = item["downloadUrl"]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    }
    
    req = urllib.request.Request(download_url, headers=headers)
    hasher = hashlib.sha256()
    total_bytes = 0
    
    with urllib.request.urlopen(req, timeout=60) as resp, open(target_mp4, "wb") as f_out:
        while True:
            chunk = resp.read(64 * 1024)
            if not chunk:
                break
            f_out.write(chunk)
            hasher.update(chunk)
            total_bytes += len(chunk)
            if total_bytes % (5 * 1024 * 1024) < 64 * 1024:
                print(f"    Downloaded {total_bytes / 1024 / 1024:.1f} MB...", end="\r")
                
    sha256 = hasher.hexdigest()
    print(f"    Finished! Total: {total_bytes / 1024 / 1024:.2f} MB, SHA256: {sha256}")
    item["sourceSHA256"] = sha256
    item["fileSize"] = total_bytes
    return item

# Let's download items 2 (wulala), 5 (liuyuxin), 1 (daoyueshe) first
priority_indices = [2, 5, 1]
for p_idx in priority_indices:
    target_item = next(it for it in items if it["index"] == p_idx)
    download_source(target_item)

# Save updated items with clean sourceIds
with open(root / "output/research/harbin/batch1_resolved.json", "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print("\nAll priority sources downloaded successfully!")
