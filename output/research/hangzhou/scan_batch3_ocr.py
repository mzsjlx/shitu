import subprocess, json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
worktree = Path(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep')
intake = worktree / 'map-base/.local/video-intake'

with open(worktree / 'output/research/hangzhou/batch3_downloaded.json', 'r', encoding='utf-8') as f:
    dl3 = json.load(f)

print(f"Scanning {len(dl3)} batch 3 videos with RapidOCR...", flush=True)

keywords = ['店', '馆', '面', '菜', '号', '路', '街', '排档', '烤', '肉', '鱼', '鸡', '生煎', '包子', '人均', '地址', '位置', '杭州', '老底子', '私房', '酒家', '火锅', '干锅', '砂锅', '大厦', '广场', '居酒屋', '餐厅', '门头', '小吃', '西湖']

for it in dl3:
    sid = it['source_id']
    vpath = intake / sid / 'source.mp4'
    if not vpath.exists(): continue
    dur = it['duration_seconds']
    author = it['author']
    print(f"\n=== {author} ({sid}) dur={dur:.1f}s ===", flush=True)
    
    # 20 samples
    step = max(5, int(dur / 22))
    times = list(range(3, int(dur)-3, step))
    
    for t in times:
        tmp_img = worktree / f'output/research/hangzhou/tmp3_{sid}_{t}.png'
        cmd = [
            ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', str(t), '-i', str(vpath),
            '-vframes', '1', '-pix_fmt', 'yuv420p',
            str(tmp_img)
        ]
        subprocess.run(cmd)
        if tmp_img.exists():
            try:
                res, _ = ocr(str(tmp_img))
                if res:
                    for line in res:
                        txt = line[1].strip()
                        if len(txt) >= 2 and any(k in txt for k in keywords):
                            print(f"  [{t}s] {txt}", flush=True)
            except Exception:
                pass
            tmp_img.unlink(missing_ok=True)

print("\nBatch 3 OCR scan finished!", flush=True)
