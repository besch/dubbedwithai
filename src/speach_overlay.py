import os
from dataclasses import dataclass
from openai import OpenAI
from pydub import AudioSegment
from datetime import datetime, timedelta
from io import BytesIO
import shutil

openai_client = OpenAI()
openai_client.api_key = os.environ['OPENAI_API_KEY']

curr_dir = os.path.dirname(os.path.abspath(__file__))
original_audio_copy = os.path.join(curr_dir, 'tmp', 'audio_copy_copy.wav')
SUBTITLE_TO_VOICE_DIR = os.path.join(curr_dir, 'tmp', 'subtitle_to_voice')

@dataclass
class Subtitle:
    start_time: str
    end_time: str
    content: str

def generate_voice_from_subtitle(subtitle: Subtitle):
    response = openai_client.audio.speech.create(
        model="tts-1",
        voice="echo",
        input=subtitle.content,
        response_format="wav"
    )
    output_file = os.path.join(SUBTITLE_TO_VOICE_DIR, f"audio_{subtitle.start_time.replace(':', '_').replace(',', '.')}_{subtitle.end_time.replace(':', '_').replace(',', '.')}.wav")
    response.stream_to_file(output_file)
    return output_file

def overlay_generated_voice_over_original_audio(audio_1: str, subtitle: Subtitle) -> str:
    if os.path.exists(original_audio_copy):
        os.remove(original_audio_copy)
    shutil.copy2(audio_1, original_audio_copy)
    
    formatted_start_time = subtitle.start_time.replace(',', '.')
    start_time = datetime.strptime(formatted_start_time, "%H:%M:%S.%f").time()
    start_time_ms = int(timedelta(hours=start_time.hour, minutes=start_time.minute, seconds=start_time.second, microseconds=start_time.microsecond // 1000).total_seconds() * 1000)

    audio1 = AudioSegment.from_file(original_audio_copy, format="wav")
    audio2 = generate_voice_from_subtitle(subtitle)
    audio2 = AudioSegment.from_file(audio2, format="wav")
    
    diff_in_dB = audio1.dBFS - audio2.dBFS
    audio2 = audio2.apply_gain(diff_in_dB)

    modified_audio1 = audio1.overlay(audio2, position=start_time_ms)
    modified_audio1 = modified_audio1 + 1
    modified_audio1.export(audio_1, format="wav")
    return audio1


def main(ORIGINAL_AUDIO_FILE: str, subtitles: list[Subtitle]):
    for subtitle in subtitles:
        try:
            overlay_generated_voice_over_original_audio(ORIGINAL_AUDIO_FILE, subtitle)
            print(f"Completed processing for subtitle: {subtitle.start_time} - {subtitle.end_time}")
        except Exception as e:
            print(f"Error processing subtitle: {subtitle.start_time} - {subtitle.end_time}, Error: {e}")

    all_audio_dir_files = os.listdir(SUBTITLE_TO_VOICE_DIR)            
    for file in all_audio_dir_files:
        file_path = os.path.join(SUBTITLE_TO_VOICE_DIR, file)
        if os.path.isfile(file_path):
            os.remove(file_path)
            
if __name__ == "__main__":
    main()