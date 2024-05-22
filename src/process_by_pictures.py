import os
import cv2
import shutil
from compreface import CompreFace
from compreface.service import RecognitionService, DetectionService, VerificationService
from compreface.collections import FaceCollection
from compreface.collections.face_collections import Subjects
import time
import json
import tqdm
import random
from utils import extract_subtitles_from_srt, subtitle_to_ms, copy_dir, FACES_DIR, ORIGINAL_VIDEO, SUBTITLES, FRAMES_DIR, FACE_VERIFICATION

DOMAIN: str = 'http://localhost'
PORT: str = '8000'
API_KEY_RECOGNITION: str = 'c4b2ea65-a422-46b3-a64b-3bdbdd803150'
API_KEY_DETECTION: str = '3c4304e3-7ecd-4bb2-ae84-629a664531a2'
API_KEY_VERIFICATION: str = '00000000-0000-0000-0000-000000000004'

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

def categorize_faces(faces_dir, categorized_dir, similarity_threshold=0.7):
    faces_items = os.listdir(faces_dir)
    for face in tqdm.tqdm(faces_items[:], total = len(faces_items)):  # Create a copy of the list
        face_path = os.path.join(faces_dir, face)
        matched_face_dir = None
        max_similarity = 0

        for existing_face_dir in os.listdir(categorized_dir):
            existing_face_path = os.path.join(categorized_dir, existing_face_dir, os.listdir(os.path.join(categorized_dir, existing_face_dir))[0])
            result = verification.verify(face_path, existing_face_path)
            
            if result.get('code') and result.get('code') == 28:
                continue
            # if not result.get('result'):
            #     continue
            
            similarity = result['result'][0]['face_matches'][0]['similarity']

            if similarity > max_similarity:
                max_similarity = similarity
                matched_face_dir = existing_face_dir

        if max_similarity > similarity_threshold:
            shutil.move(face_path, os.path.join(categorized_dir, matched_face_dir))
            faces_items.remove(face)  # Remove the moved file from the list
        else:
            new_dir = os.path.join(categorized_dir, face.split('.')[0])
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(face_path, new_dir)
            faces_items.remove(face)  # Remove the moved file from the list
            
def double_check_similar_faces(categorized_dir, similarity_threshold=0.7):
    dirs_to_check = []
    dirs_to_compare = []

    # Separate directories based on the number of images
    for dir_name in os.listdir(categorized_dir):
        dir_path = os.path.join(categorized_dir, dir_name)
        if os.path.isdir(dir_path):
            num_images = len(os.listdir(dir_path))
            if num_images < 4:
                dirs_to_check.append(dir_path)
            elif num_images >= 5:
                dirs_to_compare.append(dir_path)

    # Compare directories with less than 4 images against those with 5 or more images
    for check_dir in tqdm.tqdm(dirs_to_check, total = len(dirs_to_check)):
        check_images = os.listdir(check_dir)
        for compare_dir in dirs_to_compare:
            compare_images = os.listdir(compare_dir)
            for check_image in check_images:
                check_image_path = os.path.join(check_dir, check_image)
                for compare_image in random.sample(compare_images, min(len(compare_images), 5)):
                    compare_image_path = os.path.join(compare_dir, compare_image)
                    result = verification.verify(check_image_path, compare_image_path)

                    if result.get('code') and result.get('code') == 28:
                        continue

                    similarity = result['result'][0]['face_matches'][0]['similarity']
                    if similarity > similarity_threshold:
                        # Move the check_image to the compare_dir
                        shutil.move(check_image_path, compare_dir)
                        check_images.remove(check_image)
                        break

            # If there are no remaining images in the check_dir, remove the directory
            if not check_images:
                shutil.rmtree(check_dir)
                break

def generate_json_file(categorized_dir):
    data = []
    for speaker in os.listdir(categorized_dir):
        for face in os.listdir(os.path.join(categorized_dir, speaker)):
            start_time = face.split('.')[0]
            data.append({
                "start": int(start_time),
                "speaker": speaker,
            })
            
    data.sort(key=lambda x: x['start'])
            
    with open(FACE_VERIFICATION, 'w') as outfile:
            json.dump(data, outfile)

if __name__ == "__main__":
    # if os.path.exists(FACES_DIR):
    #     shutil.rmtree(FACES_DIR)
    # os.makedirs(FACES_DIR)

    CATEGORIZED_DIR = r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\pyframes_face_categorized"
    if os.path.exists(CATEGORIZED_DIR):
        shutil.rmtree(CATEGORIZED_DIR)
    os.makedirs(CATEGORIZED_DIR)

    # if os.path.exists(FRAMES_DIR):
    #     shutil.rmtree(FRAMES_DIR)
    # os.makedirs(FRAMES_DIR)
    
    start_time = time.time()
    
    # subtitles = extract_subtitles_from_srt(SUBTITLES)
    # extract_frames_from_video(subtitles)
    # detect_single_face()
    # categorize_faces(FACES_DIR, CATEGORIZED_DIR)
    # generate_json_file(CATEGORIZED_DIR)
    
    
    faces_dir = r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\pyframes_face"
    faces_dir_copy = r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\pyframes_face_copy"
    copy_dir(faces_dir, faces_dir_copy)
    categorize_faces(faces_dir_copy, CATEGORIZED_DIR)
    # double_check_similar_faces(CATEGORIZED_DIR)
    
    end_time = time.time()
    print(f"Execution time: {end_time - start_time} seconds")
    