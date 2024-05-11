import os
import cv2
import shutil
from compreface import CompreFace
from compreface.service import RecognitionService, DetectionService, VerificationService
from compreface.collections import FaceCollection
from compreface.collections.face_collections import Subjects
import time
import json
from utils import extract_subtitles_from_srt, subtitle_to_ms, FACES_DIR, CATEGORIZED_DIR, ORIGINAL_VIDEO, SUBTITLES, FRAMES_DIR, FACE_VERIFICATION

DOMAIN: str = 'http://localhost'
PORT: str = '8000'
API_KEY_RECOGNITION: str = '964aa302-aca5-4712-8cf3-1c6929b59b91'
API_KEY_DETECTION: str = 'eae4480b-cf40-4b28-ab4c-ddc5c349e8ba'
API_KEY_VERIFICATION: str = 'd75fe71e-8fad-4767-8fda-974349a4d4f0'

compre_face: CompreFace = CompreFace(DOMAIN, PORT, options={
    "limit": 0,
    "det_prob_threshold": 0.8,
    "prediction_count": 1,
    "face_plugins": "calculator,age,gender",
    "status": "true"
})

recognition: RecognitionService = compre_face.init_face_recognition(API_KEY_RECOGNITION)
face_collection: FaceCollection = recognition.get_face_collection()
subjects: Subjects = recognition.get_subjects()
detection: DetectionService = compre_face.init_face_detection(API_KEY_DETECTION)
verification: VerificationService = compre_face.init_face_verification(API_KEY_VERIFICATION)

def detect_single_face():
    frame_dir = os.listdir(FRAMES_DIR)
    for frame in frame_dir:
        frame_path = os.path.join(FRAMES_DIR, frame)
        output_path = os.path.join(FACES_DIR, frame)
        result = detection.detect(frame_path)
        
        if result.get('code') and result.get('code') == 28:
            continue
        
        if len(result.get('result')) == 1:
            face_info = result.get('result')[0]
            box = face_info['box']

            # Load the image using OpenCV
            image = cv2.imread(frame_path)

            # Crop the face region from the image
            x1, y1 = box['x_min'], box['y_min']
            x2, y2 = box['x_max'], box['y_max']
            face_image = image[y1:y2, x1:x2]

            # Save the face image using OpenCV
            cv2.imwrite(output_path, face_image)

def extract_frames_from_video(subtitles):
    video = cv2.VideoCapture(ORIGINAL_VIDEO)
    for subtitle in subtitles:
        sub_start = subtitle.start
        sub_start_ms = subtitle_to_ms(sub_start)
        video.set(cv2.CAP_PROP_POS_MSEC, sub_start_ms)
        success, image = video.read()
        img_path = os.path.join(FRAMES_DIR, f"{sub_start_ms}.jpg")
        cv2.imwrite(img_path, image)

def categorize_faces():
    faces_dir = os.listdir(FACES_DIR)
    for face in faces_dir[:]:  # Create a copy of the list
        face_path = os.path.join(FACES_DIR, face)
        matched_face_dir = None
        max_similarity = 0

        for existing_face_dir in os.listdir(CATEGORIZED_DIR):
            existing_face_path = os.path.join(CATEGORIZED_DIR, existing_face_dir, os.listdir(os.path.join(CATEGORIZED_DIR, existing_face_dir))[0])
            result = verification.verify(face_path, existing_face_path)
            
            if result.get('code') and result.get('code') == 28:
                continue
            
            similarity = result['result'][0]['face_matches'][0]['similarity']

            if similarity > max_similarity:
                max_similarity = similarity
                matched_face_dir = existing_face_dir

        if max_similarity > 0.7:
            shutil.move(face_path, os.path.join(CATEGORIZED_DIR, matched_face_dir))
            faces_dir.remove(face)  # Remove the moved file from the list
        else:
            new_dir = os.path.join(CATEGORIZED_DIR, face.split('.')[0])
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(face_path, new_dir)
            faces_dir.remove(face)  # Remove the moved file from the list

def generate_json_file():
    data = []
    for categorized_dir in os.listdir(CATEGORIZED_DIR):
        for face in os.listdir(os.path.join(CATEGORIZED_DIR, categorized_dir)):
            start_time = face.split('.')[0]
            data.append({
                "start": int(start_time),
                "speaker": categorized_dir,
            })
            
    data.sort(key=lambda x: x['start'])
            
    with open(FACE_VERIFICATION, 'w') as outfile:
            json.dump(data, outfile)

if __name__ == "__main__":
    # # Remove and recreate FACES_DIR
    # if os.path.exists(FACES_DIR):
    #     shutil.rmtree(FACES_DIR)
    # os.makedirs(FACES_DIR)

    # # Remove and recreate CATEGORIZED_DIR
    # if os.path.exists(CATEGORIZED_DIR):
    #     shutil.rmtree(CATEGORIZED_DIR)
    # os.makedirs(CATEGORIZED_DIR)

    # # Remove and recreate CATEGORIZED_DIR
    # if os.path.exists(FRAMES_DIR):
    #     shutil.rmtree(FRAMES_DIR)
    # os.makedirs(FRAMES_DIR)
    
    # start_time = time.time()
    
    # subtitles = extract_subtitles_from_srt(SUBTITLES)
    # extract_frames_from_video(subtitles)
    # detect_single_face()
    # categorize_faces()
    
    # end_time = time.time()
    # print(f"Execution time: {end_time - start_time} seconds")
    
    generate_json_file()