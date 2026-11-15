import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

# Let's inspect the remaining ones
targets = [
    # 乌啦啦 砂锅面: confirm exact address / door sign
    ("乌啦啦", "hb-wulala-7270343915872505143", [10, 15, 20, 22, 24]),
    # 风风 43年清真
    ("风风", "hb-fengfeng-7633725862973587558", [3, 5, 10, 15, 20, 30, 45, 60]),
    # 刘雨鑫 麻辣烫
    ("刘雨鑫麻辣烫", "hb-liuyuxin-7460360194397113612", [1, 2, 4, 6, 8, 10, 12, 16]),
    # 盗月社 麻辣烫 & 饺子
    ("盗月社", "hb-daoyueshe-7600245288900529454", [45, 55, 65, 80, 240, 250, 270, 280]),
    # 小颓废 居家菜馆
    ("小颓废", "hb-xiaotui-7554309439802543387", [2, 6, 12, 18, 24, 28]),
    # 魏味 崔家鸡馆
    ("特厨魏味", "hb-weiwei-7588038557453913370", [2, 4, 6, 10, 15, 20]),
    # 南京刘好燃 铁锅炖
    ("南京刘好燃", "hb-liuhaoran-7599247224577740964", [10, 20, 30, 50, 80, 120]),
    # 贪吃王 苍蝇馆子
    ("贪吃王", "hb-tanchiwang-7670859043891634408", [5, 15, 25, 35, 45, 55, 65, 75, 85, 95])
]

for author, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=================== {author} ({sid}) ===================", flush=True)
    for sec in secs:
        img = intake / sid / f"id_ocr_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                print(f"  [{sec:3d}s] {' | '.join(texts)}", flush=True)
            img.unlink(missing_ok=True)
