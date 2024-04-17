import os
import subprocess
from dataclasses import dataclass
from openai import OpenAI
from pydub import AudioSegment
from datetime import datetime, timedelta

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
            start_time = lines[1].split(" --> ")[0]
            end_time = lines[1].split(" --> ")[1]
            output_file = os.path.join(VOICE_DIR, f"audio_{start_time.replace(':', '_').replace(',', '.')}_{end_time.replace(':', '_').replace(',', '.')}.mp3")
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

def extract_audio_from_movie(subtitle: Subtitle, start_audio: str):
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

def remove_vocals(audio_file: str):
    output_file = os.path.join(VOCAL_DIR, os.path.basename(audio_file))
    command = f"python {VOCAL_REMOVER} --input {audio_file} --output_dir {VOCAL_DIR} --gpu 0"
    subprocess.run(command, shell=True)
    return output_file

def combine_audio_streams(audio_1: str, audio_2: str, subtitle: Subtitle) -> str:
    output_file = os.path.join(COMBINED_DIR, f"audio_{subtitle.start_time.replace(':', '_').replace(',', '.')}_{subtitle.end_time.replace(':', '_').replace(',', '.')}.mp3")
    audio_1 = audio_1.replace(".mp3", "_Instruments.wav")
    audio_1 = AudioSegment.from_file(audio_1, format="wav")
    audio_2 = AudioSegment.from_file(audio_2, format="mp3")
    
    modified_audio1 = audio_1.overlay(audio_2)
    modified_audio1.export(output_file, format="mp3")
    return output_file

def combine_audio_with_delay(audio_1: str, audio_2: str, subtitle: Subtitle) -> str:
    formatted_start_time = subtitle.start_time.replace(',', '.')
    formatted_end_time = subtitle.end_time.replace(',', '.')
    
    output_audio = os.path.join(COMBINED_DIR, f"combined_{formatted_start_time.replace(':', '_')}_{formatted_end_time.replace(':', '_')}.mp3")

    audio1 = AudioSegment.from_file(audio_1)
    audio2 = AudioSegment.from_file(audio_2)

    start_time = datetime.strptime(formatted_start_time, "%H:%M:%S.%f").time()
    end_time = datetime.strptime(formatted_end_time, "%H:%M:%S.%f").time()
    start_time_ms = int(timedelta(hours=start_time.hour, minutes=start_time.minute, seconds=start_time.second, microseconds=start_time.microsecond // 1000).total_seconds() * 1000)
    end_time_ms = int(timedelta(hours=end_time.hour, minutes=end_time.minute, seconds=end_time.second, microseconds=end_time.microsecond // 1000).total_seconds() * 1000)

    modified_audio1 = audio1[:start_time_ms] + audio2 + audio1[end_time_ms:]
    modified_audio1.export(output_audio, format="mp3")
    return output_audio

def main():
    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(VOICE_DIR, exist_ok=True)
    os.makedirs(VOCAL_DIR, exist_ok=True)
    os.makedirs(COMBINED_DIR, exist_ok=True)

    subtitles = extract_subtitles_from_srt(SUBTITLES_FILE)

    for index, subtitle in enumerate(subtitles):
        try:
            if index == 0:
                start_audio = AUDIO_FILE
            else:
                start_audio = os.path.join(COMBINED_DIR, f"combined_{subtitles[index-1].start_time.replace(':', '_').replace(',', '.')}_{subtitles[index-1].end_time.replace(':', '_').replace(',', '.')}.mp3")
                
            # generate_voice_from_subtitle(subtitle)
            audio_file = extract_audio_from_movie(subtitle, start_audio)
            vocal_removed_file = remove_vocals(audio_file)
            combined_file = combine_audio_streams(vocal_removed_file, subtitle.output_file, subtitle)
            final_file = combine_audio_with_delay(start_audio, combined_file, subtitle)

            print(f"Completed processing for subtitle: {subtitle.start_time} - {subtitle.end_time}")
        except Exception as e:
            print(f"Error processing subtitle: {subtitle.start_time} - {subtitle.end_time}, Error: {e}")

if __name__ == "__main__":
    main()