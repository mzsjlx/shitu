import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

# 1. 岛民大白
mp4_daomin = intake / "hb-daomindabai-7447440540515208508" / "source.mp4"
print("=== 岛民大白 ===")
for s in [1, 2, 3, 5, 7, 10, 14, 18, 22, 28, 35, 45, 60, 90, 120, 180, 240]:
    img = Path(f"temp_daomin_{s}.jpg")
    subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-i", str(mp4_daomin), "-frames:v", "1", "-vf", "scale=1080:-1", str(img)])
    if img.exists():
        res, _ = ocr(str(img))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            print(f"[{s:3d}s] " + " | ".join(texts)[:120])
        img.unlink()

# 2. 小曹和辉哥
mp4_xiaocao = intake / "hb-xiaocaohehuige-7572409902087675107" / "source.mp4"
print("\n=== 小曹和辉哥 ===")
for s in [1, 2, 3, 5, 7, 10, 14, 18, 22, 28, 35, 45, 60, 90, 120, 180, 240]:
    img = Path(f"temp_xiaocao_{s}.jpg")
    subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-i", str(mp4_xiaocao), "-frames:v", "1", "-vf", "scale=1080:-1", str(img)])
    if img.exists():
        res, _ = ocr(str(img))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            print(f"[{s:3d}s] " + " | ".join(texts)[:120])
        img.unlink()
