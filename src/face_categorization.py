import os
import cv2
import shutil
from compreface import CompreFace
from compreface.service import RecognitionService, DetectionService, VerificationService
from compreface.collections import FaceCollection
from compreface.collections.face_collections import Subjects
import time
import json
from tqdm import tqdm
from tqdm.contrib import tenumerate
import random
import heapq
from utils import extract_subtitles_from_srt, get_files_sorted_by_size, subtitle_to_ms, copy_dir, remove_dir_and_recreate, FACES_DIR, ORIGINAL_VIDEO, SUBTITLES, FRAMES_DIR, FACE_VERIFICATION

DOMAIN: str = 'http://localhost'
PORT: str = '8000'
API_KEY_RECOGNITION: str = '00000000-0000-0000-0000-000000000002'
API_KEY_DETECTION: str = '00000000-0000-0000-0000-000000000003'
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

def detected_face(image_path) -> bool:
    result = detection.detect(image_path)
    return not (result.get('code') == 28)

def extract_frames_from_video(subtitles):
    video = cv2.VideoCapture(ORIGINAL_VIDEO)
    for subtitle in subtitles:
        sub_start = subtitle.start
        sub_start_ms = subtitle_to_ms(sub_start)
        video.set(cv2.CAP_PROP_POS_MSEC, sub_start_ms)
        success, image = video.read()
        img_path = os.path.join(FRAMES_DIR, f"{sub_start_ms}.jpg")
        cv2.imwrite(img_path, image)

def categorize_faces(FACES_DIR, batch=19, similarity_threshold=0.7):
    FACES_COPY_DIR = copy_dir(FACES_DIR)
    CATEGORIZED_FACES_DIR = FACES_DIR + '_categorized'
    remove_dir_and_recreate(CATEGORIZED_FACES_DIR)
    
    faces_sorted_by_size = get_files_sorted_by_size(FACES_COPY_DIR)
    created_folder_count = 0

    for face_path in tqdm(faces_sorted_by_size[:], total=len(faces_sorted_by_size)):
        if not detected_face(face_path):
            continue

        matched_face_dir = None
        max_similarity = 0
        # Sort the directories in categorized_dir by the number of files in descending order
        sorted_dirs = sorted(os.listdir(CATEGORIZED_FACES_DIR), key=lambda d: len(os.listdir(os.path.join(CATEGORIZED_FACES_DIR, d))), reverse=True)

        # # If there are more than 9 directories, filter out those with only one file
        # if len(sorted_dirs) > batch:
        #     filtered_dirs = [d for d in sorted_dirs if len(os.listdir(os.path.join(CATEGORIZED_FACES_DIR, d))) > 3]

        for existing_face_dir in sorted_dirs:
            existing_face_path = os.path.join(CATEGORIZED_FACES_DIR, str(existing_face_dir))
            biggest_image_in_existing_face_dir = get_files_sorted_by_size(existing_face_path)[0]

            result = verification.verify(face_path, biggest_image_in_existing_face_dir)
            similarity = result['result'][0]['face_matches'][0]['similarity']

            if similarity > max_similarity:
                max_similarity = similarity
                matched_face_dir = existing_face_dir

        if max_similarity > similarity_threshold:
            shutil.move(face_path, os.path.join(CATEGORIZED_FACES_DIR, matched_face_dir))
            faces_sorted_by_size.remove(face_path)  # Remove the moved file from the list
        # elif len(sorted_dirs) <= batch:
        else:
            new_dir = os.path.join(CATEGORIZED_FACES_DIR, str(created_folder_count))
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(face_path, new_dir)
            faces_sorted_by_size.remove(face_path)  # Remove the moved file from the list
            created_folder_count += 1

            # Check if 5 folders have been created
            # if created_folder_count % 5 == 0:
            #     check_for_duplicates_in_categorized_faces(categorized_dir, similarity_threshold)
            #     created_folder_count = 0  # Reset the count

            
def find_similar_faces_in_directories(chunks_dir, similarity_threshold=0.7):
    sorted_chunks = sorted(os.listdir(chunks_dir))
    all_face_dirs = []
    for chunk in sorted_chunks:
        chunk_dir = os.path.join(chunks_dir, chunk)
        faces_categorized_dir = os.path.join(chunk_dir, 'faces_categorized')
        
        # Sort faces_categorized directories
        sorted_face_dirs = sorted(os.path.join(faces_categorized_dir, face_dir) for face_dir in os.listdir(faces_categorized_dir))
        
        # Add face_dir only if it has at least two images
        for face_dir in sorted_face_dirs:
            face_images = [os.path.join(face_dir, f) for f in os.listdir(face_dir) if f.endswith(('.jpg', '.png'))]
            if len(face_images) >= 2:
                all_face_dirs.append(face_dir)

    for i, face_dir1 in tenumerate(all_face_dirs, total=len(all_face_dirs), desc="Comparing face dirs"):
        chunk1 = os.path.dirname(os.path.dirname(face_dir1))
        
        # Check if face_dir1 exists
        if os.path.isdir(face_dir1):
            face_images1 = [os.path.join(face_dir1, f) for f in os.listdir(face_dir1) if f.endswith(('.jpg', '.png'))]
        else:
            continue
        
        # Compare face_dir1 with all other face_dirs within the same chunk
        for face_dir2 in [fd for fd in all_face_dirs if os.path.dirname(os.path.dirname(fd)) == chunk1]:
            if face_dir1 != face_dir2:
                compare_face_dirs(face_dir1, face_dir2, similarity_threshold)
        
        # Compare face_dir1 with face_dirs from other chunks
        for face_dir2 in all_face_dirs[i+1:]:
            chunk2 = os.path.dirname(os.path.dirname(face_dir2))
            if chunk1 != chunk2:
                compare_face_dirs(face_dir1, face_dir2, similarity_threshold)

def compare_face_dirs(face_dir1, face_dir2, similarity_threshold):
    face_images1 = [os.path.join(face_dir1, f) for f in os.listdir(face_dir1) if f.endswith(('.jpg', '.png'))]
    
    try:
        face_images2 = [os.path.join(face_dir2, f) for f in os.listdir(face_dir2) if f.endswith(('.jpg', '.png'))]
    except FileNotFoundError:
        return
    
    if face_images1 and face_images2:
        largest_images1 = heapq.nlargest(5, face_images1, key=lambda x: os.path.getsize(x))
        largest_images2 = heapq.nlargest(5, face_images2, key=lambda x: os.path.getsize(x))
        
        image1 = random.choice(largest_images1)
        image2 = random.choice(largest_images2)
        
        result = verification.verify(image1, image2)
        similarity = result['result'][0]['face_matches'][0]['similarity']
        
        if similarity >= similarity_threshold:
            # Move all images from face_dir2 to face_dir1
            for img in face_images2:
                shutil.move(img, face_dir1)
            
            # Remove the now empty face_dir2
            shutil.rmtree(face_dir2)
    
            
def check_for_duplicates_in_categorized_faces(categorized_dir, similarity_threshold=0.7):
    filtered_dirs = [d for d in os.listdir(categorized_dir) if 2 <= len(os.listdir(os.path.join(categorized_dir, d))) <= 4]

    for i, existing_face_dir in enumerate(tqdm(filtered_dirs)):
        existing_face_paths = [os.path.join(categorized_dir, existing_face_dir, f) for f in os.listdir(os.path.join(categorized_dir, existing_face_dir))]
        existing_face_path = existing_face_paths[1]  # Take the second image in the directory

        for j, other_face_dir in enumerate(filtered_dirs[i+1:], start=i+1):
            other_face_paths = [os.path.join(categorized_dir, other_face_dir, f) for f in os.listdir(os.path.join(categorized_dir, other_face_dir))]
            other_face_path = other_face_paths[1]  # Take the second image in the directory

            result = verification.verify(existing_face_path, other_face_path)
            similarity = result['result'][0]['face_matches'][0]['similarity']

            if similarity > similarity_threshold:
                # Move images from other_face_dir to existing_face_dir
                for img_path in other_face_paths:
                    shutil.move(img_path, os.path.join(categorized_dir, existing_face_dir))
                os.rmdir(os.path.join(categorized_dir, other_face_dir))
                
                # Remove the other_face_dir from filtered_dirs
                filtered_dirs.remove(other_face_dir)

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
    