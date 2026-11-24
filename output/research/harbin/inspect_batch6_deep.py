import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    # 乌啦啦 砂锅面
    ("特别乌啦啦", "hb-wulala-7270343915872505143", [25, 30, 35, 45, 60, 80, 100]),
    # 盗月社 两家神级小店
    ("盗月社", "hb-daoyueshe-7600245288900529454", [30, 50, 70, 90, 120, 160, 200, 260, 300, 340, 400]),
    # 风风 43年清真
    ("风风", "hb-fengfeng-7633725862973587558", [8, 12, 18, 25, 35, 50, 70]),
    # 小颓废 排骨
    ("小颓废", "hb-xiaotui-7554309439802543387", [5, 10, 15, 20, 25, 35, 45, 60]),
    # 刘雨鑫 麻辣烫
    ("刘雨鑫麻辣烫", "hb-liuyuxin-7460360194397113612", [2, 5, 8, 12, 18, 25, 35]),
    # 钮祜禄小刺猬 韩餐
    ("钮祜禄小刺猬", "hb-xiaociwei-7592457034574985701", [8, 12, 18, 25, 35, 50]),
    # 姚十八
    ("姚十八", "hb-yaoshiba-7579959689283194150", [2, 5, 10, 20, 40, 60]),
    # 锅包肉肉
    ("锅包肉肉", "hb-guobaorourou-7628142458585586865", [2, 5, 10, 15, 20, 30, 40]),
    # 魏味 崔家鸡馆
    ("特厨魏味", "hb-weiwei-7588038557453913370", [8, 15, 25, 40, 60])
]

for author, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=================== {author} ({sid}) ===================", flush=True)
    for sec in secs:
        img = intake / sid / f"deep_ocr_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                print(f"  [{sec:3d}s] {' | '.join(texts)}", flush=True)
            img.unlink(missing_ok=True)
