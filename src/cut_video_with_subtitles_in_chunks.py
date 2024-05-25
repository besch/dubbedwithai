import os
import subprocess
import pysrt
from datetime import datetime

def cut_video_and_subtitles_into_chunks(input_video, output_dir, subtitle_file, chunk_duration=600):
    os.makedirs(output_dir, exist_ok=True)

    # Cut video into chunks using FFmpeg
    output_pattern = os.path.join(output_dir, "chunk_%03d.mp4")
    ffmpeg_cmd = [
        'ffmpeg', '-i', input_video,
        '-map', '0:v',
        '-map', '0:a:1',  # !!!!!!!!! Copy second audio stream
        '-c', 'copy',
        '-f', 'segment',
        '-segment_time', str(chunk_duration),
        '-reset_timestamps', '1',
        output_pattern
    ]
    subprocess.run(ffmpeg_cmd, check=True)

    # Load subtitles
    subs = pysrt.open(subtitle_file)

    # Split subtitles into chunks
    for i, video_chunk in enumerate(sorted(os.listdir(output_dir))):
        if video_chunk.endswith('.mp4'):
            chunk_dir = os.path.join(output_dir, f"chunk_{i:03d}")
            os.makedirs(chunk_dir, exist_ok=True)

            start_time = chunk_duration * i
            end_time = start_time + chunk_duration

            chunk_subs = [sub for sub in subs
                           if (datetime(1, 1, 1, sub.start.to_time().hour, sub.start.to_time().minute, sub.start.to_time().second) - datetime(1, 1, 1)).total_seconds() >= start_time
                           and (datetime(1, 1, 1, sub.start.to_time().hour, sub.start.to_time().minute, sub.start.to_time().second) - datetime(1, 1, 1)).total_seconds() < end_time]

            if chunk_subs:
                chunk_sub_file = os.path.join(chunk_dir, "subtitles.srt")
                pysrt.SubRipFile(chunk_subs).save(chunk_sub_file, encoding='utf-8')

            os.rename(os.path.join(output_dir, video_chunk),
                      os.path.join(chunk_dir, video_chunk))

# Example usage
input_video = r"C:\Users\user\Downloads\Chlopaki Nie Placza.mp4"
subtitle_file = r"C:\Users\user\Downloads\subtitles.srt"
output_dir = r"C:\Users\user\Downloads\cutted"

# Split into 10-minute chunks (default)
cut_video_and_subtitles_into_chunks(input_video, output_dir, subtitle_file)