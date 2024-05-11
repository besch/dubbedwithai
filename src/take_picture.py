import os
from dataclasses import dataclass
import cv2
from utils import extract_subtitles_from_srt, Subtitle, subtitle_to_ms, openai_client, ORIGINAL_VIDEO, SUBTITLES

curr_dir = os.path.dirname(os.path.abspath(__file__))
tmp_dir = os.path.join(curr_dir, "tmp")
PICTURES_DIR = os.path.join(tmp_dir, 'pictures')
take_picture_delay_ms = 300

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

def take_pictures_from_subtitles(video_file: str, subtitles: list[Subtitle]):
    for subtitle in subtitles:
        time = subtitle_to_ms(subtitle.start) + take_picture_delay_ms
        cap = cv2.VideoCapture(video_file)
        cap.set(cv2.CAP_PROP_POS_MSEC, time)
        ret, frame = cap.read()
        cv2.imwrite(os.path.join(PICTURES_DIR, f'{time}.jpg'), frame)
        

subtitles = extract_subtitles_from_srt(SUBTITLES)
take_pictures_from_subtitles(ORIGINAL_VIDEO, subtitles)