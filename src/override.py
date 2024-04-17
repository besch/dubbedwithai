import os
import ffmpeg
from pydub import AudioSegment


HOME_DIR = r"C:\\Users\\user\\Desktop\\Projects\\dubbedwithai"
TMP_DIR = os.path.join(HOME_DIR, 'tmp')
ORIGINAL_DIR = os.path.join(TMP_DIR, 'original')
AUDIO_DIR = os.path.join(TMP_DIR, 'extract-subtitle-audio')
VOICE_DIR = os.path.join(TMP_DIR, 'subtitle-to-voice')
COMBINED_DIR = os.path.join(TMP_DIR, 'combine-two-audio-streams')
AUDIO_FILE = os.path.join(ORIGINAL_DIR, 'audio2.mp3')
SUBTITLES_FILE = os.path.join(ORIGINAL_DIR, 'subtitles.srt')
VOCAL_REMOVER = os.path.join(HOME_DIR, 'vocal_remover', 'inference.py')

# Input audio files
override_audio = os.path.join(COMBINED_DIR, 'audio_00_00_00.583_00_00_03.583.mp3')
output_audio = os.path.join(COMBINED_DIR, 'OUTPUT.mp3')

audio1 = AudioSegment.from_file(AUDIO_FILE)
audio2 = AudioSegment.from_file(override_audio)

# Override details
start_time = 0
end_time = 3.583

start_time_ms = int(start_time * 1000)
end_time_ms = int(end_time * 1000)

# replacement_segment = audio2[start_time_ms:end_time_ms]

# Replace the segment in audio1 with the replacement segment from audio2
modified_audio1 = audio1[:start_time_ms] + audio2 + audio1[end_time_ms:]

# Export the modified audio file
modified_audio1.export(output_audio, format="mp3")

# # Load the main audio
# main = ffmpeg.input(AUDIO_FILE)

# # Load the override audio
# override = ffmpeg.input(override_audio)

# # Crop the main audio to the desired length
# audio2_cropped = ffmpeg.output(main, 'audio2_cropped.mp3', vcodec='copy', acodec='copy', ss=0, t=(end_time - start_time))
# audio2_cropped = ffmpeg.filter(audio2_cropped, 'atrim', start=start_time, end=end_time)

# # Overlay the cropped audio2 file onto the override audio
# output = ffmpeg.overlay(override, audio2_cropped)

# # Save the final output
# output.output(output_audio).run()