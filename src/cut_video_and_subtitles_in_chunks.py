import os
import subprocess
import pysrt
from datetime import datetime, timedelta
from math import ceil

def cut_subtitles_in_chunks(subtitle_file, output_dir, chunk_duration=600):
    os.makedirs(output_dir, exist_ok=True)

    # Load subtitles
    subs = pysrt.open(subtitle_file)

    # Convert SubRipTime to datetime
    start_time = datetime.combine(datetime.min.date(), subs[0].start.to_time())
    end_time = datetime.combine(datetime.min.date(), subs[-1].end.to_time())

    # Calculate the total duration of the subtitles
    total_duration = (end_time - start_time).total_seconds()

    # Calculate the number of chunks required
    num_chunks = ceil(total_duration / chunk_duration)

    # Split subtitles into chunks
    for i in range(num_chunks):
        chunk_dir = os.path.join(output_dir, f"chunk_{i:03d}")
        os.makedirs(chunk_dir, exist_ok=True)

        start_chunk = start_time + timedelta(seconds=chunk_duration * i)
        end_chunk = start_chunk + timedelta(seconds=chunk_duration)

        chunk_subs = [sub for sub in subs if start_chunk <= datetime.combine(datetime.min.date(), sub.start.to_time()) < end_chunk]

        if chunk_subs:
            chunk_sub_file = os.path.join(chunk_dir, "subtitles.srt")
            pysrt.SubRipFile(chunk_subs).save(chunk_sub_file, encoding='utf-8')



def cut_in_chunks(input_video, subtitle_file, output_dir, chunk_duration=600):
    os.makedirs(output_dir, exist_ok=True)

    # Cut video into chunks using FFmpeg
    output_pattern = os.path.join(output_dir, "chunk_%03d.mp4")
    ffmpeg_cmd = [
        'ffmpeg', '-i', input_video,
        '-map', '0:v',
        '-map', '0:a:1',  # !!!!!!!!! Copy second audio stream, make change if needed
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
