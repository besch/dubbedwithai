import os
from dataclasses import dataclass
import cv2
import pytesseract
import face_recognition
import pandas as pd
from collections import defaultdict
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