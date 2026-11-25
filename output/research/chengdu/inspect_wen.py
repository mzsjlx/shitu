import os, cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

os.makedirs('output/research/chengdu/frames_wen', exist_ok=True)

# inspect 15s to 50s every 1s
for s in range(18, 50):
    frame_idx = int(s * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        res, _ = ocr(frame)
        texts = [r[1] for r in res] if res else []
        print(f"Frame {s}s: {' | '.join(texts)}")
        # If interesting text, save image
        cv2.imwrite(f'output/research/chengdu/frames_wen/frame_{s:02d}s.jpg', frame)

cap.release()
