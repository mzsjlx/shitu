import os, sys, cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()

def extract_and_ocr(video_path, sample_interval_sec=2, max_frames=60, start_sec=0):
    video_path = os.path.abspath(video_path)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    print(f"\nAnalyzing {video_path}: duration={duration:.1f}s, fps={fps}")
    
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
    return results

if __name__ == '__main__':
    # 1. cd-dage: check first 45 seconds for shop sign / queue number / menu
    res_dage = extract_and_ocr('map-base/.local/video-intake/cd-dage-7597692982615261083/source.mp4', sample_interval_sec=1.5, max_frames=30, start_sec=0)
    print("=== DAGE FIRST 45s ===")
    for sec, texts in res_dage:
        print(f"[{sec:05.1f}s]: {' | '.join(texts)}")

    # 2. cd-wenyoulala: check first 45 seconds for shop name / location
    res_wen = extract_and_ocr('map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4', sample_interval_sec=2, max_frames=25, start_sec=0)
    print("=== WENYOU LALA FIRST 50s ===")
    for sec, texts in res_wen:
        print(f"[{sec:05.1f}s]: {' | '.join(texts)}")

    # 3. cd-renyi: check whole video (134s) at 2.5s interval
    res_ren = extract_and_ocr('map-base/.local/video-intake/cd-renyi-7606583802420317455/source.mp4', sample_interval_sec=2.5, max_frames=55, start_sec=0)
    print("=== RENYI ALL ===")
    for sec, texts in res_ren:
        print(f"[{sec:05.1f}s]: {' | '.join(texts)}")
