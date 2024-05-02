import os
import subprocess
from dataclasses import dataclass
from pydub import AudioSegment
from datetime import datetime, timedelta


curr_dir = os.path.dirname(os.path.abspath(__file__))
vocal_remover = os.path.join(curr_dir, 'lib', 'vocal_remover', 'inference.py')
temp_dir = os.path.join(curr_dir, 'tmp')
AUDIO_DIR = os.path.join(temp_dir, 'extract-subtitle-audio')
VOCAL_DIR = os.path.join(temp_dir, 'audio-remove-vocals')

@dataclass
class Subtitle:
    start_time: str
    end_time: str
    content: str

def extract_subtitle_audio(subtitle: Subtitle, start_audio: str):
    formatted_start_time = subtitle.start_time.replace(',', '.')
    formatted_end_time = subtitle.end_time.replace(',', '.')
    
    output_file = os.path.join(AUDIO_DIR, f"audio_{formatted_start_time.replace(':', '_')}_{formatted_end_time.replace(':', '_')}.mp3")
    start_audio = AudioSegment.from_file(start_audio, format="mp3")
    start_time = datetime.strptime(formatted_start_time, "%H:%M:%S.%f").time()
    end_time = datetime.strptime(formatted_end_time, "%H:%M:%S.%f").time()
    start_time_ms = int(timedelta(hours=start_time.hour, minutes=start_time.minute, seconds=start_time.second, microseconds=start_time.microsecond // 1000).total_seconds() * 1000)
    end_time_ms = int(timedelta(hours=end_time.hour, minutes=end_time.minute, seconds=end_time.second, microseconds=end_time.microsecond // 1000).total_seconds() * 1000)

    part_audio = start_audio[start_time_ms:end_time_ms]
    part_audio.export(output_file, format="mp3")
    return output_file

def remove_vocals_from_audio(audio_file: str):
    output_file = os.path.join(VOCAL_DIR, os.path.basename(audio_file))
    command = f"python {vocal_remover} --input {audio_file} --output_dir {VOCAL_DIR} --gpu 0"
    subprocess.run(command, shell=True)
    return output_file

def insert_no_vocal_audio_part_into_original_audio(audio_1: str, audio_2: str, subtitle: Subtitle) -> str:
    formatted_start_time = subtitle.start_time.replace(',', '.')
    formatted_end_time = subtitle.end_time.replace(',', '.')
    
    audio1 = AudioSegment.from_file(audio_1)
    audio2 = AudioSegment.from_file(audio_2)

    start_time = datetime.strptime(formatted_start_time, "%H:%M:%S.%f").time()
    end_time = datetime.strptime(formatted_end_time, "%H:%M:%S.%f").time()
    start_time_ms = int(timedelta(hours=start_time.hour, minutes=start_time.minute, seconds=start_time.second, microseconds=start_time.microsecond // 1000).total_seconds() * 1000)
    end_time_ms = int(timedelta(hours=end_time.hour, minutes=end_time.minute, seconds=end_time.second, microseconds=end_time.microsecond // 1000).total_seconds() * 1000)

    modified_audio1 = audio1[:start_time_ms] + audio2 + audio1[end_time_ms:]
    modified_audio1.export(audio_1, format="mp3")
    return audio_1

def main(ORIGINAL_AUDIO_FILE: str, subtitles: list[Subtitle]):
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(VOCAL_DIR, exist_ok=True)
    
    for subtitle in subtitles:
        try:
            audio_file = extract_subtitle_audio(subtitle, ORIGINAL_AUDIO_FILE)
            vocal_removed_file = remove_vocals_from_audio(audio_file)
            vocal_removed_file = vocal_removed_file.replace(".mp3", "_Instruments.wav")
            final_audio = insert_no_vocal_audio_part_into_original_audio(ORIGINAL_AUDIO_FILE, vocal_removed_file, subtitle)
            
            VOCAL_DIR

            print(f"Completed processing for subtitle: {subtitle.start_time} - {subtitle.end_time}")
        except Exception as e:
            print(f"Error processing subtitle: {subtitle.start_time} - {subtitle.end_time}, Error: {e}")
            
    all_audio_dir_files = os.listdir(AUDIO_DIR)
    all_vocal_dir_files = os.listdir(VOCAL_DIR)
    
    for file in all_audio_dir_files:
        file_path = os.path.join(AUDIO_DIR, file)
        if os.path.isfile(file_path):
            os.remove(file_path)
            
    for file in all_vocal_dir_files:
        file_path = os.path.join(VOCAL_DIR, file)
        if os.path.isfile(file_path):
            os.remove(file_path)
            

if __name__ == "__main__":
    main()