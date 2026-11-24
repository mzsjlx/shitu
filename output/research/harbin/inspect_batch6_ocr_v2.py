import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    ("特别乌啦啦", "hb-wulala-7270343915872505143", [1, 2, 3, 5, 8, 12, 20]),
    ("盗月社食遇记", "hb-daoyueshe-7600245288900529454", [5, 10, 20, 40, 80, 150, 250, 350]),
    ("风风", "hb-fengfeng-7633725862973587558", [1, 2, 4, 6, 10, 15, 25]),
    ("小颓废的嘴", "hb-xiaotui-7554309439802543387", [1, 2, 4, 8, 12, 18, 30]),
    ("特厨魏味", "hb-weiwei-7588038557453913370", [2, 5, 10, 20, 30]),
    ("刘雨鑫麻辣烫", "hb-liuyuxin-7460360194397113612", [1, 3, 6, 10, 15]),
    ("钮祜禄小刺猬", "hb-xiaociwei-7592457034574985701", [1, 3, 6, 10, 15, 25])
]

for author, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=================== {author} ({sid}) ===================", flush=True)
    for sec in secs:
        img = intake / sid / f"ocr_test_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                print(f"  [{sec:3d}s] {' | '.join(texts)}", flush=True)
            img.unlink(missing_ok=True)
