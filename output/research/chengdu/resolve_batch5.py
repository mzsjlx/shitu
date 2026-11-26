import urllib.request
import re
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

raw_links = [
    ("岛民大白", "daomindabai", "https://v.douyin.com/oGozuTIN6cU/"),
    ("小紧张的虫虫", "xiaojinzhangdechongchong", "https://v.douyin.com/C_0Xzgcw-Dg/"),
    ("特别乌啦啦", "wulala", "https://v.douyin.com/rBUBfZPymRQ/"),
    ("JoJo觅食", "jojomishi", "https://v.douyin.com/hArgGJeBJKw/"),
    ("是 Simon 啊", "shisimon", "https://v.douyin.com/hoxqlgUK6cg/"),
    ("贺千万。", "heqianwan", "https://v.douyin.com/0GCicxnpL3M/"),
    ("霹雳干饭记", "piliganfanji", "https://v.douyin.com/nNvV8zil_bc/"),
    ("马伯骞", "maboqian", "https://v.douyin.com/xq6m7O66BZE/"),
    ("小解", "xiaojie", "https://v.douyin.com/nJhrVJUTpzw/")
]

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}

results = []

for author_name, slug, share_url in raw_links:
    print(f"Resolving {author_name}: {share_url}...")
    req = urllib.request.Request(share_url, headers=HEADERS_MOBILE)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            final_url = resp.geturl()
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {share_url}: {e}")
        continue
    
    print(f"  Final URL: {final_url}")
    # Match video ID
    m = re.search(r'/video/(\d+)', final_url)
    if not m:
        m = re.search(r'modal_id=(\d+)', final_url)
    if not m:
        m = re.search(r'item_ids=(\d+)', final_url)
    aweme_id = m.group(1) if m else None
    
    # Extract router data
    data_match = re.search(r'window\._ROUTER_DATA\s*=\s*(\{.*?\});</script>', html, re.DOTALL)
    aweme_data = None
    if data_match:
        try:
            router_data = json.loads(data_match.group(1))
            loader_data = router_data.get('loaderData', {})
            # Look for item_list or video item
            for k, v in loader_data.items():
                if isinstance(v, dict) and 'item_list' in v:
                    aweme_data = v['item_list'][0]
                    break
                elif isinstance(v, dict) and 'video' in v and 'desc' in v:
                    aweme_data = v
                    break
        except Exception as e:
            print(f"  Failed parsing router data: {e}")
            
    if not aweme_data:
        # Fallback regex
        title_m = re.search(r'<title>(.*?)</title>', html)
        title = title_m.group(1) if title_m else ""
        results.append({
            "author": author_name,
            "slug": slug,
            "share_url": share_url,
            "final_url": final_url,
            "aweme_id": aweme_id,
            "title": title,
            "aweme_data": None
        })
    else:
        desc = aweme_data.get('desc', '')
        author = aweme_data.get('author', {}).get('nickname', author_name)
        create_time = aweme_data.get('create_time')
        vid = aweme_data.get('aweme_id', aweme_id)
        video_info = aweme_data.get('video', {})
        play_addr = video_info.get('play_addr', {}).get('url_list', [])
        cover_addr = video_info.get('cover', {}).get('url_list', [])
        
        results.append({
            "author": author,
            "slug": slug,
            "share_url": share_url,
            "final_url": final_url,
            "aweme_id": vid,
            "desc": desc,
            "create_time": create_time,
            "play_urls": play_addr,
            "cover_urls": cover_addr,
            "aweme_data": aweme_data
        })
        print(f"  Got item: {vid} | {author} | {desc[:40]}")

out_path = Path("output/research/chengdu/batch5_sources_meta.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Done. Saved {len(results)} sources to {out_path}")
