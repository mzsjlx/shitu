import cv2
from pathlib import Path

intake = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
out_dir = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\inspect_batch5_posters")
out_dir.mkdir(parents=True, exist_ok=True)

checks = [
    {"vid": "hz-yangsang-7653525512216707913", "sec": 106.0, "name": "shiye_sign"},
    {"vid": "hz-yangsang-7653525512216707913", "sec": 220.0, "name": "shiye_dish"},
    {"vid": "hz-niuniu-7646324850500266737", "sec": 33.0, "name": "picatham_outdoor"},
    {"vid": "hz-niuniu-7646324850500266737", "sec": 120.0, "name": "picatham_fish"},
    {"vid": "hz-niuniu-7646324850500266737", "sec": 168.0, "name": "picatham_dapao"},
    {"vid": "hz-jieou-7641070065438731368", "sec": 28.0, "name": "duizhao_chicken"},
    {"vid": "hz-jieou-7641070065438731368", "sec": 64.0, "name": "changshun_lamb"},
    {"vid": "hz-jieou-7641070065438731368", "sec": 92.0, "name": "shuimohui_table"},
    {"vid": "hz-jiding-7709105067328419515", "sec": 26.0, "name": "ganbei_oden"},
    {"vid": "hz-jiding-7709105067328419515", "sec": 80.0, "name": "sushi_zhengchuan"},
    {"vid": "hz-jiding-7709105067328419515", "sec": 121.0, "name": "shadow_island"},
    {"vid": "hz-jiding-7709105067328419515", "sec": 165.0, "name": "miangmiang_shrimp"}
]

for c in checks:
    p = intake / f"{c['vid']}.mp4"
    cap = cv2.VideoCapture(str(p))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(c["sec"] * fps))
    ret, frame = cap.read()
    if ret:
        out_path = out_dir / f"{c['name']}.jpg"
        cv2.imwrite(str(out_path), frame)
        print(f"Saved {out_path.name}")
    cap.release()
