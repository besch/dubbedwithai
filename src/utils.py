import os
from dataclasses import dataclass
import cv2
import shutil
from openai import OpenAI

@dataclass
class Subtitle:
    start: str
    end: str
    text: str

openai_client = OpenAI()
openai_client.api_key = os.environ['OPENAI_API_KEY']

curr_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(curr_dir, "source")
tmp_dir = os.path.join(curr_dir, "tmp")
ORIGINAL_VIDEO = os.path.join(source_dir, 'original_video_full.mp4')
ORIGINAL_AUDIO = os.path.join(source_dir, 'audio - Copy.wav')
ORIGINAL_AUDIO_MP3 = os.path.join(source_dir, 'audio.mp3')
SUBTITLES = os.path.join(source_dir, 'subtitles.srt')
PICTURES = os.path.join(tmp_dir, 'pictures')
VISION = os.path.join(tmp_dir, 'vision.json')
CSV = os.path.join(tmp_dir, 'final.csv')
OUTPUT_AUDIO = os.path.join(tmp_dir, 'output_audio.wav')
RESPONSE_DATA = os.path.join(tmp_dir,'response_data.json')
UPDATED_RESPONSE_DATA = os.path.join(tmp_dir,'updated_response_data.json')
FACES_DIR = os.path.join(tmp_dir,'faces_dir')
FACES_DIR_TEMP = os.path.join(tmp_dir,'faces_dir_temp')
FRAMES_DIR = os.path.join(tmp_dir,'frames_dir')
CATEGORIZED_DIR = os.path.join(tmp_dir,'categorized')
FACE_VERIFICATION = os.path.join(tmp_dir,'face_verification.json')
take_picture_delay_ms = 300

def extract_subtitles_from_srt(filename: str) -> list[Subtitle]:
    subtitles = []
    with open(filename, 'r', encoding='utf-8') as file:
        subtitle_blocks = file.read().split('\n\n')
        for block in subtitle_blocks:
            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue

            # Extract the start and end times
            start = lines[1].split(" --> ")[0]
            end = lines[1].split(" --> ")[1]
            text = '\n'.join(lines[2:])

            subtitles.append(Subtitle(start, end, text))

    return subtitles
    
def subtitle_to_ms(time_str):
    """
    Converts a subtitle time format of "00:05:04,120" to milliseconds.
    
    Args:
        time_str (str): The subtitle time in the format "00:05:04,120".
    
    Returns:
        int: The time in milliseconds.
    """
    # Split the time string into hours, minutes, seconds, and milliseconds
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds_parts = parts[2].split(',')
    seconds = int(seconds_parts[0])
    milliseconds = int(seconds_parts[1])
    
    # Calculate the total milliseconds
    total_ms = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds
    
    return total_ms

def ms_to_subtitle_time(ms):
    """
    Converts a time in milliseconds to the SRT time format "00:00:00,000".
    
    Args:
        ms (int): The time in milliseconds.
    
    Returns:
        str: The time in the SRT format "00:00:00,000".
    """
    # Calculate the hours, minutes, seconds, and remaining milliseconds
    hours = ms // 3600000
    minutes = (ms % 3600000) // 60000
    seconds = (ms % 60000) // 1000
    remaining_ms = ms % 1000
    
    # Format the time string
    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d},{remaining_ms:03d}"
    
    return time_str

def extract_face_from_image(input: str, box, output: str):
    image = cv2.imread(input)
    x1, y1 = box['x_min'], box['y_min']
    x2, y2 = box['x_max'], box['y_max']
    face_image = image[y1:y2, x1:x2]
    
    if (face_image.shape[0] > 0 and face_image.shape[1] > 0):
        cv2.imwrite(output, face_image)

def copy_dir(source_dir, dest_dir):
    shutil.rmtree(dest_dir, ignore_errors=True)
    shutil.copytree(source_dir, dest_dir)

def get_files_sorted_by_size(directory):
    files = []
    for entry in os.scandir(directory):
        if entry.is_file():
            files.append((entry.path, entry.stat().st_size))
    
    # Sort the list of tuples by file size
    files.sort(key=lambda x: x[1], reverse=True)
    files = [file[0] for file in files]
    
    return files

def sort_dirs_by_num_of_files(dirs):
    return dirs.sort(key=lambda x: len(os.listdir(x)), reverse=True)

def initialize_start_dir(video_path):
    original_dir = os.path.dirname(video_path)
    original_file_name_with_ext = os.path.basename(video_path)
    original_file_name, ext = os.path.splitext(original_file_name_with_ext)
    START_DIR = os.path.join(original_dir, original_file_name)
    
    if os.path.exists(START_DIR):
        shutil.rmtree(START_DIR)
        os.makedirs(START_DIR)
        
    TMP_DIR = os.path.join(START_DIR, "tmp")
    CHUNKS_DIR = os.path.join(TMP_DIR, "chunks")
    TALKNET_DIR = os.path.join(TMP_DIR, "talknet")
    
    os.makedirs(TMP_DIR, exist_ok = True)
    os.makedirs(CHUNKS_DIR, exist_ok = True)
    os.makedirs(TALKNET_DIR, exist_ok = True)
    
    return START_DIR, TMP_DIR, CHUNKS_DIR, TALKNET_DIR