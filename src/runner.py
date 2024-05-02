import os
import subprocess
from dataclasses import dataclass
from openai import OpenAI
from pydub import AudioSegment
from datetime import datetime, timedelta
import vocal_extractor
import speach_overlay
import shutil
import ffmpeg

curr_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(curr_dir, "source")
tmp_dir = os.path.join(curr_dir, "tmp")
FINAL_VIDEO = os.path.join(curr_dir, "tmp", 'final_video.mp4')
ONLY_VIDEO = os.path.join(source_dir, 'video.mp4')
ONLY_AUDIO = os.path.join(source_dir, 'audio.mp3')
ONLY_AUDIO_COPY = os.path.join(tmp_dir, 'audio_copy.mp3')
SUBTITLES = os.path.join(source_dir, 'subtitles.srt')

@dataclass
class Subtitle:
    start_time: str
    end_time: str
    content: str

def extract_subtitles_from_srt(filename: str) -> list[Subtitle]:
    subtitles = []
    with open(filename, 'r') as file:
        subtitle_blocks = file.read().split('\n\n')
        for block in subtitle_blocks:
            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue

            # Extract the start and end times
            start_time = lines[1].split(" --> ")[0]
            end_time = lines[1].split(" --> ")[1]
            content = '\n'.join(lines[2:])

            subtitles.append(Subtitle(start_time, end_time, content))

    return subtitles

# def extract_audio_and_video_from_original_video():
#     try:
#         ffmpeg_video = f'ffmpeg -i {ONLY_VIDEO} -vcodec copy -an -y {VIDEO_FILE}'
#         subprocess.call(ffmpeg_video, shell=True)
#     except Exception as e:
#         print(f"Failed to extract video, Error: {e}")
    
#     try:
#         ffmpeg_audio = f'ffmpeg -i {ONLY_VIDEO} -acodec libmp3lame -vn -y {AUDIO_FILE}'
#         subprocess.call(ffmpeg_audio, shell=True)
#     except Exception as e:
#         print(f"Failed to extract audio, Error: {e}")
        
#         ffmpeg_audio = f'ffmpeg -i {ONLY_VIDEO} -acodec libmp3lame -vn -y {AUDIO_FILE}'
#     return AUDIO_FILE
    
def combine_audio_and_video(video_file: str, audio_file: str) -> str:
    if os.path.exists(FINAL_VIDEO):
        os.remove(FINAL_VIDEO)
    
    video = ffmpeg.input(video_file)
    audio = ffmpeg.input(audio_file)
    output = ffmpeg.output(video, audio, FINAL_VIDEO, vcodec='copy', acodec='aac', strict='experimental')
    ffmpeg.run(output)

def main():
    if os.path.exists(ONLY_AUDIO_COPY):
        os.remove(ONLY_AUDIO_COPY)
    shutil.copy2(ONLY_AUDIO, ONLY_AUDIO_COPY)
    
    
    subtitles = extract_subtitles_from_srt(SUBTITLES)
    vocal_extractor.main(ONLY_AUDIO_COPY, subtitles)
    speach_overlay.main(ONLY_AUDIO_COPY, subtitles)
            
    # AUDIO_FILE = extract_audio_and_video_from_original_video()
    combine_audio_and_video(ONLY_VIDEO, ONLY_AUDIO_COPY)

if __name__ == "__main__":
    main()