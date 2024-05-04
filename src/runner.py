import os
from dataclasses import dataclass
import speach_overlay
import shutil
import ffmpeg
from audio_separator.separator import Separator
import subprocess

curr_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(curr_dir, "source")
tmp_dir = os.path.join(curr_dir, "tmp")
ORIGINAL_VIDEO = os.path.join(source_dir, 'original_video.mp4')
SUBTITLES = os.path.join(source_dir, 'subtitles.srt')

ONLY_VIDEO = os.path.join(tmp_dir, 'video.mp4')
ONLY_AUDIO = os.path.join(tmp_dir, 'audio.wav')
FINAL_VIDEO = os.path.join(tmp_dir, 'final_video.mp4')
# ONLY_AUDIO_COPY = os.path.join(tmp_dir, 'audio_copy.wav')

@dataclass
class Subtitle:
    start_time: str
    end_time: str
    content: str

def extract_subtitles_from_srt(filename: str) -> list[Subtitle]:
    subtitles = []
    with open(filename, 'r', encoding='utf-8') as file:
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

def extract_audio_and_video_from_original_video(video):
    try:
        ffmpeg_video = f'ffmpeg -i {video} -vcodec copy -an -y {ONLY_VIDEO}'
        subprocess.call(ffmpeg_video, shell=True)
    except Exception as e:
        print(f"Failed to extract video, Error: {e}")
    
    try:
        ffmpeg_audio = f'ffmpeg -i {video} -acodec libmp3lame -vn -y {ONLY_AUDIO}'
        subprocess.call(ffmpeg_audio, shell=True)
    except Exception as e:
        print(f"Failed to extract audio, Error: {e}")
        
        ffmpeg_audio = f'ffmpeg -i {video} -acodec libmp3lame -vn -y {ONLY_AUDIO}'
    return ONLY_AUDIO



def separate_vocals(audio):
    separator = Separator()
    separator.load_model(model_filename='UVR-MDX-NET-Inst_HQ_3.onnx')

    output_file_paths = separator.separate(audio)

    # The separated vocals will be saved as the first output file
    vocals_file = output_file_paths[1]
    return vocals_file
    
def combine_audio_and_video(video_file: str, audio_file: str) -> str:
    if os.path.exists(FINAL_VIDEO):
        os.remove(FINAL_VIDEO)
    
    video = ffmpeg.input(video_file)
    audio = ffmpeg.input(audio_file)
    output = ffmpeg.output(video, audio, FINAL_VIDEO, vcodec='copy', acodec='pcm_s16le', strict='experimental')
    ffmpeg.run(output)

def main():
    # if os.path.exists(ONLY_AUDIO_COPY):
    #     os.remove(ONLY_AUDIO_COPY)
    # shutil.copy2(ONLY_AUDIO, ONLY_AUDIO_COPY)
    
    AUDIO_FILE = extract_audio_and_video_from_original_video(ORIGINAL_VIDEO)
    
    subtitles = extract_subtitles_from_srt(SUBTITLES)
    instrumental_audio = separate_vocals(AUDIO_FILE)
    speach_overlay.main(instrumental_audio, subtitles)
            
    combine_audio_and_video(ONLY_VIDEO, instrumental_audio)

if __name__ == "__main__":
    main()