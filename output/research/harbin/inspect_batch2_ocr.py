import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
frames_base = root / "output/research/harbin/frames"
frames_base.mkdir(parents=True, exist_ok=True)

ocr = RapidOCR()

selected_sources = [
    "hb-特别乌啦啦-7585062675730779427",
    "hb-特厨隋坡重新出发-7532707521379699968",
    "hb-达哥在上海-7419632775109578025",
    "hb-玲子reiko-7607291212181163300",
    "hb-真探唐仁杰-7293734337541918003",
    "hb-刘雨鑫JASON-7460912322115112204",
    "hb-给我囊次一口-7599605004614756837",
    "hb-喵喵酱-7300097591973268748",
    "hb-小笼人-7358179621713595674",
    "hb-刘雨鑫JASON-7290460823955197241"
]

def inspect(source_id, max_seconds=45, fps=1):
    mp4 = intake_dir / source_id / "source.mp4"
    if not mp4.exists():
        print(f"Skipping {source_id}, file not found")
        return
        
    out_dir = frames_base / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(list(out_dir.glob("frame_*.jpg")))
    if not existing:
        cmd = [
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", "0", "-i", str(mp4),
            "-t", str(max_seconds),
            "-vf", f"fps={fps},scale=720:-1",
            str(out_dir / "frame_%03d.jpg")
        ]
        subprocess.run(cmd, check=True)
        existing = sorted(list(out_dir.glob("frame_*.jpg")))
        
    findings = []
    keywords = ['街', '路', '道', '区', '店', '馆', '坊', '居', '号', '哈', '市', '串', '肚', '包', '肉', '烧烤', '大鹅', '冷面', '盒饭', '老', '菜市场', '酒楼', '饺子']
    for f in existing:
        res, _ = ocr(str(f))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            line = " | ".join(texts)
            if any(k in line for k in keywords):
                findings.append(f"{f.name}: {line}")
                
    result_txt = out_dir / "ocr_findings.txt"
    result_txt.write_text("\n".join(findings), encoding="utf-8")
    print(f"\n==========================================")
    print(f"Results for {source_id} ({len(findings)} matches):")
    for l in findings[:8]:
        print("  ", l)

if __name__ == '__main__':
    for sid in selected_sources:
        inspect(sid)
