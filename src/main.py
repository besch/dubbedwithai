import os
import subprocess
from dataclasses import dataclass
from typing import Tuple
from openai import OpenAI

# Set up environment
HOME_DIR = r"C:\Users\user\Desktop\Projects\dubbedwithai"
TMP_DIR = os.path.join(HOME_DIR, 'tmp')
ORIGINAL_DIR = os.path.join(TMP_DIR, 'original')
AUDIO_DIR = os.path.join(TMP_DIR, 'extract-subtitle-audio')
VOICE_DIR = os.path.join(TMP_DIR, 'subtitle-to-voice')
VOCAL_DIR = os.path.join(TMP_DIR, 'audio-remove-vocals')
COMBINED_DIR = os.path.join(TMP_DIR, 'combine-two-audio-streams')

AUDIO_FILE = os.path.join(ORIGINAL_DIR, 'audio2.mp3')
SUBTITLES_FILE = os.path.join(ORIGINAL_DIR, 'subtitles.srt')
VOCAL_REMOVER = os.path.join(HOME_DIR, 'vocal_remover', 'inference.py')

openai_client = OpenAI()
openai_client.api_key = os.environ['OPENAI_API_KEY']

@dataclass
class Subtitle:
    start_time: str
    end_time: str
    output_file: str
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
            start_time = lines[1].split(" --> ")[0].split(',')[0]
            end_time = lines[1].split(" --> ")[1].split(',')[0]
            output_file = os.path.join(VOICE_DIR, f"audio_{start_time.replace(':', '_')}_{end_time.replace(':', '_')}.mp3")
            content = '\n'.join(lines[2:])

            subtitles.append(Subtitle(start_time, end_time, output_file, content))

    return subtitles

def generate_voice_from_subtitle(subtitle: Subtitle):
    response = openai_client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=subtitle.content
    )
    response.stream_to_file(subtitle.output_file)

def extract_audio_from_movie(subtitle: Subtitle):
    output_file = os.path.join(AUDIO_DIR, f"audio_{subtitle.start_time.replace(':', '_')}_{subtitle.end_time.replace(':', '_')}.mp3")
    ffmpeg_command = [
        "ffmpeg",
        "-i", AUDIO_FILE,
        "-ss", subtitle.start_time,
        "-to", subtitle.end_time,
        "-acodec", "copy",
        "-f", "mp3",
        output_file
    ]
    try:
        subprocess.run(ffmpeg_command, check=True, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e.stderr.decode().strip()}")
        raise e
    return output_file

def remove_vocals(audio_file: str):
    output_file = os.path.join(VOCAL_DIR, os.path.basename(audio_file))
    command = f"python {VOCAL_REMOVER} --input {audio_file} --output_dir {VOCAL_DIR} --gpu 0"
    subprocess.run(command, shell=True)
    return output_file

def combine_audio_streams(audio_1: str, audio_2: str) -> str:
    audio_1 = audio_1.replace(".mp3", "_Instruments.wav")
    output_file = os.path.join(COMBINED_DIR, 'combined_audio.mp3')
    subprocess.run(['ffmpeg', '-i', audio_1, '-i', audio_2, '-filter_complex', '[0:a][1:a]amerge=inputs=2[aout]', '-map', '[aout]', output_file], check=True)
    return output_file

def combine_audio_with_delay(audio_1: str, audio_2: str, delay: str) -> str:
    output_file = os.path.join(COMBINED_DIR, 'combined_audio_final.mp3')
    hours, minutes, seconds = map(int, delay.split(':'))
    delay = hours * 3600 + minutes * 60 + seconds
    delay_ms = delay * 1000

    duration_cmd = f'ffprobe -i "{audio_1}" -show_entries format=duration -v quiet -of csv="p=0"'
    duration_1 = float(subprocess.check_output(duration_cmd, shell=True))

    duration_cmd = f'ffprobe -i "{audio_2}" -show_entries format=duration -v quiet -of csv="p=0"'
    duration_2 = float(subprocess.check_output(duration_cmd, shell=True))

    ffmpeg_cmd = (
        f'ffmpeg -hwaccel cuda -hwaccel_device 0 '
        f'-i "{audio_1}" -i "{audio_2}" '
        f'-filter_complex "[0:a]atrim=start=0:end={delay_ms}[audio1_1];'
        f'[0:a]atrim=start={delay_ms+duration_2}:end={duration_1}[audio1_2];'
        f'[1:a]atrim=start=0:end={duration_2}[audio2_1];'
        f'[audio1_1][audio2_1][audio1_2]concat=n=3:v=0:a=1[outaudio]" '
        f'-map "[outaudio]" -c:a libmp3lame -c:v hevc_nvenc -preset p7 -rc constqp -qp 25 -tag:v hvc1 "{output_file}"'
    )
    subprocess.call(ffmpeg_cmd, shell=True)
    return output_file

def main():
    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(VOICE_DIR, exist_ok=True)
    os.makedirs(VOCAL_DIR, exist_ok=True)
    os.makedirs(COMBINED_DIR, exist_ok=True)

    subtitles = extract_subtitles_from_srt(SUBTITLES_FILE)

    for subtitle in subtitles:
        try:
            generate_voice_from_subtitle(subtitle)
            audio_file = extract_audio_from_movie(subtitle)
            vocal_removed_file = remove_vocals(audio_file)
            combined_file = combine_audio_streams(vocal_removed_file, subtitle.output_file)
            final_file = combine_audio_with_delay(AUDIO_FILE, combined_file, subtitle.start_time)

            # combined_file = os.path.join(TMP_DIR, 'combine-two-audio-streams', 'combined_audio.mp3')
            # final_file = combine_audio_with_delay(AUDIO_FILE, combined_file, subtitle.start_time)

            print(f"Completed processing for subtitle: {subtitle.start_time} - {subtitle.end_time}")
        except Exception as e:
            print(f"Error processing subtitle: {subtitle.start_time} - {subtitle.end_time}, Error: {e}")

if __name__ == "__main__":
    main()