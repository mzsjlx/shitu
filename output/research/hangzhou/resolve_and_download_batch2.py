import urllib.request, re, json, time, hashlib, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {
        "idx": 1,
        "author": "Lex在中国",
        "title": "杭州这个美食战术我必须给到一个夯！# 假期的快乐是...",
        "short_url": "https://v.douyin.com/NJs9WkqAELE/"
    },
    {
        "idx": 2,
        "author": "嘴馋小迟",
        "title": "杭州我终于来啦！来看看都有什么宝藏美食？！# 杭州...",
        "short_url": "https://v.douyin.com/ivIxDQitZJg/"
    },
    {
        "idx": 3,
        "author": "是张张呀",
        "title": "拿了那么多榜单的百家鸡味馆居然是这种水平， 虽然平...",
        "short_url": "https://v.douyin.com/UEXGc5HAMnY/"
    },
    {
        "idx": 4,
        "author": "一坨小草莓",
        "title": "杭州并不是“美食荒漠”只要绕开这两点走 一路都是好...",
        "short_url": "https://v.douyin.com/Q-cBbvUYRsE/"
    },
    {
        "idx": 5,
        "author": "瓦萨北北(全国巡烤中)",
        "title": "杭州四十年原著民，一天吃遍犄角旮旯小店 # 瓦萨北...",
        "short_url": "https://v.douyin.com/D0_iCOMKLdU/"
    },
    {
        "idx": 6,
        "author": "小J的日常（活跃版）",
        "title": "杭州！！最怕倒闭的几家店！！# 杭州美食 # 杭州...",
        "short_url": "https://v.douyin.com/YMn6j0AIBD4/"
    },
    {
        "idx": 7,
        "author": "麦总去哪吃",
        "title": "杭州萧山100元7个菜，这在杭州算地板价了吧？ #...",
        "short_url": "https://v.douyin.com/hUq24Cw7k4I/"
    },
    {
        "idx": 8,
        "author": "丹牛食",
        "title": "杭州三天10家店！千年小吃百年包子，40年爆鱔半湯...",
        "short_url": "https://v.douyin.com/4ebFpdLM3W4/"
    },
    {
        "idx": 9,
        "author": "曾曾辣台妹",
        "title": "来到杭州以为是美食荒漠！结果被这里的川菜味道震惊了...",
        "short_url": "https://v.douyin.com/crkyUSOhDig/"
    },
    {
        "idx": 11,
        "author": "瓦萨北北(全国巡烤中)",
        "title": "杭州40年土著分享 主城区3家犄角旮旯小店 # 瓦...",
        "short_url": "https://v.douyin.com/3yoocnG_-Ds/"
    },
    {
        "idx": 12,
        "author": "鲨鲨又馋了",
        "title": "飞机起飞前极限10小时逛吃杭州 肥嘟嘟东坡肉配上爆...",
        "short_url": "https://v.douyin.com/9Dcg8Qixta4/"
    },
    {
        "idx": 13,
        "author": "风味杭州",
        "title": "今天盘点一下 在杭州人均40以上 我心中的那些宝藏...",
        "short_url": "https://v.douyin.com/VFVgU8b3i24/"
    },
    {
        "idx": 14,
        "author": "耶叔，一个人吃饭",
        "title": "65元吃了一碗腰花爆鳝面 # 杭州美食 # 老余杭...",
        "short_url": "https://v.douyin.com/VwBf6F2rTbc/"
    },
    {
        "idx": 15,
        "author": "嘿嘿逛吃噜",
        "title": "杭州本地人带路！地道逛吃路线…好吃好玩！ 假期来杭...",
        "short_url": "https://v.douyin.com/hwVnF5_sGBE/"
    },
    {
        "idx": 16,
        "author": "小紧张的虫虫",
        "title": "在杭州的闽南小吃，道道惊艳！非常有实力的街边小店！...",
        "short_url": "https://v.douyin.com/sEiTGR7jGBM/"
    },
    {
        "idx": 17,
        "author": "瓦萨北北(全国巡烤中)",
        "title": "杭州30多年土著，一天带你吃遍杭州 40年老杭帮菜...",
        "short_url": "https://v.douyin.com/ANISwqHEAWI/"
    }
]

author_pinyin = {
    "Lex在中国": "lex",
    "嘴馋小迟": "zuichanxiaochi",
    "是张张呀": "shizhangzhangya",
    "一坨小草莓": "yituoxiaocaomei",
    "瓦萨北北(全国巡烤中)": "wasabeibei",
    "小J的日常（活跃版）": "xiaoj",
    "麦总去哪吃": "maizong",
    "丹牛食": "danniushi",
    "曾曾辣台妹": "zengzeng",
    "鲨鲨又馋了": "shashayouchanle",
    "风味杭州": "fengweihangzhou",
    "耶叔，一个人吃饭": "yeshu",
    "嘿嘿逛吃噜": "heiheiguangchilu",
    "小紧张的虫虫": "xiaojinzhangdechongchong"
}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect)
opener.addheaders = [('User-Agent', mobile_ua)]

print(f"Resolving {len(raw_items)} short URLs...")
resolved = []

for item in raw_items:
    short_url = item['short_url']
    final_location = ""
    try:
        req = urllib.request.Request(short_url)
        resp = opener.open(req)
        final_location = resp.geturl()
    except urllib.error.HTTPError as e:
        final_location = e.headers.get('Location', '')
    except Exception as e:
        final_location = f"Error: {e}"
        
    vid_match = re.search(r'/video/(\d+)', final_location)
    vid = vid_match.group(1) if vid_match else ""
    canonical_url = f"https://www.douyin.com/video/{vid}" if vid else final_location
    
    author_tag = author_pinyin.get(item['author'], 'creator')
    source_id = f"hz-{author_tag}-{vid}" if vid else f"hz-{author_tag}-unknown"
    
    entry = {
        "idx": item['idx'],
        "author": item['author'],
        "title": item['title'],
        "short_url": short_url,
        "vid": vid,
        "canonical_url": canonical_url,
        "source_id": source_id
    }
    resolved.append(entry)
    print(f"[{item['idx']:02d}] {item['author']} -> vid: {vid} | {source_id}")
    time.sleep(0.3)

out_res_file = worktree_root / "output/research/hangzhou/batch2_resolved.json"
out_res_file.write_text(json.dumps(resolved, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Saved resolved links to {out_res_file}")

# 2. Fetch metadata and download
def fetch_aweme(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception:
            time.sleep(1)
    return None

def download_video(url, target_path):
    req = urllib.request.Request(url, headers={
        'User-Agent': mobile_ua,
        'Referer': 'https://www.douyin.com/'
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp, open(target_path, 'wb') as f:
                while chunk := resp.read(1024 * 1024):
                    f.write(chunk)
            return True
        except Exception as e:
            print(f"  Retry download: {e}", flush=True)
            if target_path.exists(): target_path.unlink()
            time.sleep(1.5)
    return False

def check_video(path):
    cmd = [ffmpeg_exe, "-v", "error", "-i", str(path), "-f", "null", "-"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

downloaded = []
print("\nFetching video metadata and downloading MP4s...")
for r in resolved:
    vid = r['vid']
    s_id = r['source_id']
    if not vid:
        print(f"Skipping {s_id}: no vid")
        continue
    
    print(f"\n--- Processing [{r['idx']:02d}] {r['author']} ({vid}) ---")
    detail = fetch_aweme(vid)
    if not detail:
        print(f"  Warning: failed to fetch aweme detail for {vid}")
        continue
    
    title = detail.get('desc', r['title'])
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else "2026-01-01"
    
    video_info = detail.get('video', {})
    play_addr = video_info.get('play_addr', {})
    url_list = play_addr.get('url_list', [])
    dur_sec = round(detail.get('duration', 0) / 1000.0, 2)
    
    # Target directory
    s_dir = intake_dir / s_id
    s_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = s_dir / "source.mp4"
    
    download_ok = False
    if target_mp4.exists() and target_mp4.stat().st_size > 100000:
        if check_video(target_mp4):
            print(f"  Existing source.mp4 verified ({target_mp4.stat().st_size} bytes)")
            download_ok = True
    
    if not download_ok:
        for u in url_list:
            print(f"  Downloading from: {u[:60]}...")
            if download_video(u, target_mp4):
                if check_video(target_mp4):
                    download_ok = True
                    break
                else:
                    print("  Corrupt video file, retrying next url...")
                    if target_mp4.exists(): target_mp4.unlink()
    
    if not download_ok:
        print(f"  ERROR: Could not download valid MP4 for {s_id}")
        continue
        
    raw_bytes = target_mp4.read_bytes()
    f_size = len(raw_bytes)
    f_sha = hashlib.sha256(raw_bytes).hexdigest()
    
    rec = {
        "idx": r['idx'],
        "author": r['author'],
        "source_id": s_id,
        "vid": vid,
        "short_url": r['short_url'],
        "canonical_url": r['canonical_url'],
        "title": title,
        "published_on": pub_date,
        "duration_seconds": dur_sec,
        "source_sha256": f_sha,
        "bytes": f_size,
        "status": "ready"
    }
    downloaded.append(rec)
    print(f"  Success: {dur_sec}s, {f_size} bytes, sha256={f_sha[:10]}...")
    time.sleep(0.5)

out_dl_file = worktree_root / "output/research/hangzhou/batch2_downloaded.json"
out_dl_file.write_text(json.dumps(downloaded, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"\nBatch 2 downloading complete! Successfully verified {len(downloaded)} videos.")
