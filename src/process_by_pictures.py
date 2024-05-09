import os
import cv2
import face_recognition
import pandas as pd
from collections import defaultdict
from utils import extract_subtitles_from_srt, subtitle_to_ms, Subtitle, FACES_DIR, CATEGORIZED_DIR
import shutil

# Remove and recreate FACES_DIR
if os.path.exists(FACES_DIR):
    shutil.rmtree(FACES_DIR)
os.makedirs(FACES_DIR)

# Remove and recreate CATEGORIZED_DIR
if os.path.exists(CATEGORIZED_DIR):
    shutil.rmtree(CATEGORIZED_DIR)
os.makedirs(CATEGORIZED_DIR)

curr_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(curr_dir, "source")
tmp_dir = os.path.join(curr_dir, "tmp")
ORIGINAL_VIDEO = os.path.join(source_dir, 'original_video_full.mp4')
SUBTITLES = os.path.join(source_dir, 'subtitles.srt')
CSV = os.path.join(tmp_dir, 'final.csv')

def extract_frames_from_video(subtitles):
    video = cv2.VideoCapture(ORIGINAL_VIDEO)
    
    for subtitle in subtitles:
        sub_start = subtitle.start
        sub_start_ms = subtitle_to_ms(sub_start)
        video.set(cv2.CAP_PROP_POS_MSEC, sub_start_ms)
        success, image = video.read()
        cv2.imwrite(os.path.join(FACES_DIR, f"{sub_start_ms}.jpg"), image)

def detect_faces_in_images():
    face_encodings = {}
    face_names = defaultdict(list)

    for image_path in os.listdir(FACES_DIR):
        image = face_recognition.load_image_file(os.path.join(FACES_DIR, image_path))
        face_locations = face_recognition.face_locations(image)

        if len(face_locations) == 1:
            face_encoding = face_recognition.face_encodings(image, face_locations)[0]
            name = image_path.split(".")[0]

            if not any(face_recognition.compare_faces(list(face_encodings.values()), face_encoding)):
                face_encodings[name] = face_encoding
            else:
                for key, value in face_encodings.items():
                    if face_recognition.compare_faces([value], face_encoding)[0]:
                        face_names[key].append(os.path.join(FACES_DIR, image_path))

    return face_names

def categorize_faces(face_names):
    for actor_name, image_paths in face_names.items():
        actor_dir = os.path.join(CATEGORIZED_DIR, actor_name)
        os.makedirs(actor_dir, exist_ok=True)
        for image_path in image_paths:
            if os.path.exists(image_path):
                os.rename(image_path, os.path.join(actor_dir, os.path.basename(image_path)))

def save_to_csv(face_names, subtitles):
    data = []
    for subtitle in subtitles:
        subtitle_start_ms = subtitle_to_ms(subtitle.start)
        for actor_name, image_paths in face_names.items():
            for image_path in image_paths:
                if str(subtitle_start_ms) in image_path:
                    data.append({
                        'subtitle.start': subtitle.start,
                        'subtitle_to_ms(subtitle.start)': subtitle_start_ms,
                        'actor_name': actor_name,
                        'actor_images_path': image_path
                    })

    df = pd.DataFrame(data)
    df.to_csv(CSV, index=False)

def main():
    subtitles = extract_subtitles_from_srt(SUBTITLES)
    extract_frames_from_video(subtitles)
    face_names = detect_faces_in_images()
    categorize_faces(face_names)
    save_to_csv(face_names, subtitles)

if __name__ == "__main__":
    main()