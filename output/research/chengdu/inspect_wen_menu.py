import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

with open('output/research/chengdu/wen_menu_head.txt', 'w', encoding='utf-8') as f:
    for s in range(68, 77):
        frame_idx = int(s * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            res, _ = ocr(frame)
            f.write(f"\n=== Frame {s}s ===\n")
            if res:
                for item in res:
                    f.write(f"  {item[1]}\n")
            cv2.imwrite(f'output/research/chengdu/frames_wen/menu_{s}s.jpg', frame)

cap.release()
