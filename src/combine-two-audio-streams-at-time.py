import os
import subprocess

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_1 = os.path.join(home_dir, 'tmp', 'original', 'audio1.mp3')
audio_2 = os.path.join(home_dir, 'tmp', 'subtitle-to-voice', 'audio_00_00_49_00_00_50.mp3')
output_file = os.path.join(home_dir, 'tmp', 'combine-two-audio-streams', 'combined_audio.mp3')

# Get duration of the first audio file
duration_cmd = f'ffprobe -i "{audio_1}" -show_entries format=duration -v quiet -of csv="p=0"'
duration = float(subprocess.check_output(duration_cmd, shell=True))

# Calculate delay for the second audio file
delay = 3  # Delay in seconds
delay_ms = delay * 1000

# Use ffmpeg to concatenate the two audio files with the desired offset
ffmpeg_cmd = (f'ffmpeg -i "{audio_1}" -i "{audio_2}" '
              f'-filter_complex "[1:a]adelay={delay_ms}|{delay_ms}[delayed];[0:a][delayed]amix" '
              f'-c:a libmp3lame "{output_file}"')
subprocess.call(ffmpeg_cmd, shell=True)
