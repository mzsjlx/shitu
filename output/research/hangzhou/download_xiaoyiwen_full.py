import urllib.request, json, time, sys
from pathlib import Path

root = Path(r"D:\Antigravity\地图")
target_dir = root / "map-base/.local/video-intake/hz-xiaoyiwen-7601446280635906202"
target_dir.mkdir(parents=True, exist_ok=True)
target = target_dir / "source.mp4"

mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
endpoint = "https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id=7601446280635906202&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua})

with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))

detail = data.get('aweme_detail', {})
play_urls = detail.get('video', {}).get('play_addr', {}).get('url_list', [])
print("Found play urls:", len(play_urls))

downloaded = False
for p_url in play_urls:
    print(f"Trying url: {p_url[:80]}...")
    d_req = urllib.request.Request(p_url, headers={
        'User-Agent': mobile_ua,
        'Referer': 'https://www.douyin.com/'
    })
    try:
        with urllib.request.urlopen(d_req, timeout=30) as d_resp:
            expected_len = int(d_resp.headers.get('Content-Length', 0))
            print(f"Content-Length: {expected_len}")
            tmp_target = target_dir / "source.tmp.mp4"
            with open(tmp_target, "wb") as f:
                downloaded_bytes = 0
                while chunk := d_resp.read(512 * 1024):
                    f.write(chunk)
                    downloaded_bytes += len(chunk)
            print(f"Downloaded: {downloaded_bytes} bytes")
            if expected_len and downloaded_bytes < expected_len:
                print(f"Incomplete download ({downloaded_bytes} < {expected_len})")
                tmp_target.unlink(missing_ok=True)
                continue
            if tmp_target.stat().st_size > 10000000: # at least 10MB
                tmp_target.replace(target)
                downloaded = True
                print("Successfully downloaded full video!")
                break
    except Exception as e:
        print("Download exception:", e)

if not downloaded:
    print("Failed to download full video!")
    sys.exit(1)
