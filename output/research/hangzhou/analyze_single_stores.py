import subprocess, json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
root = Path(r"D:\Antigravity\地图")
intake_dir = root / "map-base/.local/video-intake"

targets = [
    ("hz-suipo-7691365898199797046", "特厨隋坡"),
    ("hz-xiaojia-7539578218773286178", "小甲同学"),
    ("hz-wulala-7125679146512043301", "特别乌啦啦_包子"),
    ("hz-dazhuanchuzi-7617018607931802554", "大专厨子_松针烤油边"),
    ("hz-xiaoyiwen-7601446280635906202", "小怡雯_水煮鱼"),
    ("hz-hongshuqin-7661669844861029668", "红薯味的芹菜_东北菜"),
    ("hz-langweixian-7617698306088668456", "浪胃仙_冒菜"),
    ("hz-qifeiyizai-7623649482890071347", "起飞一仔_贵州菜"),
    ("hz-dazhuanchuzi-7580260208439624699", "大专厨子_铁板烧"),
    ("hz-wenyoulala-7652680490016656690", "温油辣辣U_海鲜小馆"),
    ("hz-panghuyimiba-7601802944681718961", "胖虎一米八_苍蝇馆子"),
    ("hz-wasabeibei-7625924661646583995", "瓦萨北北_港式早点")
]

results = {}

for sid, label in targets:
    vid = intake_dir / sid / "source.mp4"
    if not vid.exists():
        continue
    texts = []
    for s in [1.0, 3.0, 5.0, 8.0, 12.0, 16.0, 20.0, 25.0, 30.0]:
        img = f"tmp_{sid}_{int(s)}.jpg"
        p = subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(s), '-i', str(vid), '-vframes', '1', '-strict', 'unofficial', '-q:v', '2', img])
        if Path(img).exists():
            res, _ = ocr(img)
            Path(img).unlink(missing_ok=True)
            if res:
                t = " | ".join([r[1] for r in res])
                texts.append(f"{s}s: {t}")
    results[sid] = {"label": label, "samples": texts}
    print(f"=== {label} ({sid}) ===")
    for t in texts[:4]:
        print(" ", t)

out_file = root / ".local/worktrees/hangzhou-prep/output/research/hangzhou/single_stores_ocr.json"
out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf8")
print("\nDone! Results saved to single_stores_ocr.json")
