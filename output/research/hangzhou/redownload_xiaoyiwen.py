import urllib.request, json, time, subprocess, hashlib
from pathlib import Path

root = Path(r"D:\Antigravity\地图")
intake_dir = root / "map-base/.local/video-intake/hz-xiaoyiwen-7601446280635906202"
intake_dir.mkdir(parents=True, exist_ok=True)
target = intake_dir / "source.mp4"

mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
endpoint = "https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id=7601446280635906202&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua})
with urllib.request.urlopen(req, timeout=12) as resp:
    data = json.loads(resp.read().decode('utf-8'))

detail = data['aweme_detail']
play_urls = detail.get('video', {}).get('play_addr', {}).get('url_list', [])
print("Found play urls:", len(play_urls))

for p_url in play_urls:
    print(f"Trying url: {p_url[:60]}...")
    d_req = urllib.request.Request(p_url, headers={'User-Agent': mobile_ua, 'Referer': 'https://www.douyin.com/'})
    try:
        with urllib.request.urlopen(d_req, timeout=30) as d_resp:
            expected_len = int(d_resp.headers.get('Content-Length', 0))
            print(f"Content-Length: {expected_len}")
            chunks = []
            while chunk := d_resp.read(1024 * 1024):
                chunks.append(chunk)
            content = b''.join(chunks)
            if expected_len and len(content) < expected_len:
                print(f"Incomplete download ({len(content)} < {expected_len})")
                continue
            target.write_bytes(content)
            print(f"Saved {len(content)} bytes to {target}")
            break
    except Exception as e:
        print(f"Error: {e}")

# Verify with ffmpeg
ffmpeg = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
p = subprocess.run([ffmpeg, "-v", "error", "-i", str(target), "-f", "null", "-"], capture_output=True, text=True)
print("FFmpeg error check:", p.stderr if p.stderr else "CLEAN NO ERRORS!")
sha256 = hashlib.sha256(target.read_bytes()).hexdigest()
print(f"New SHA256: {sha256}")
