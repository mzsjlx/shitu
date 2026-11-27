import os, sys, cv2
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

def extract_and_ocr(video_path, sample_interval_sec=2, max_frames=80, start_sec=0):
    video_path = os.path.abspath(video_path)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    interval_frames = int(fps * sample_interval_sec)
    current_frame = int(fps * start_sec)
    
    frames_checked = 0
    results = []
    
    while current_frame < total_frames and frames_checked < max_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret:
            break
        sec = current_frame / fps
        res, _ = ocr(frame)
        if res:
            texts = [r[1] for r in res]
            results.append((sec, texts))
        current_frame += interval_frames
        frames_checked += 1
        
    cap.release()
    return duration, results

def analyze_all():
    videos = [
        ("cd-dage", "map-base/.local/video-intake/cd-dage-7597692982615261083/source.mp4", 1.5, 40, 0),
        ("cd-wenyoulala", "map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4", 2.0, 40, 0),
        ("cd-renyi", "map-base/.local/video-intake/cd-renyi-7606583802420317455/source.mp4", 2.0, 70, 0),
        ("cd-jianxishishen", "map-base/.local/video-intake/cd-jianxishishen-7626213680585166118/source.mp4", 3.0, 90, 0),
    ]

    with open('output/research/chengdu/ocr_results.txt', 'w', encoding='utf-8') as out_f:
        for tag, vpath, interval, max_f, start_s in videos:
            msg = f"\n==================== {tag} ====================\n"
            print(msg)
            out_f.write(msg)
            duration, results = extract_and_ocr(vpath, interval, max_f, start_s)
            out_f.write(f"Duration: {duration:.1f}s\n")
            for sec, texts in results:
                line = f"[{sec:05.1f}s]: {' | '.join(texts)}\n"
                out_f.write(line)
                if any(k in ' '.join(texts) for k in ['店', '街', '路', '号', '菜', '楼', '馆', '市', '区', '￥', '元']):
                    print(line.strip())
            out_f.flush()

if __name__ == '__main__':
    analyze_all()
