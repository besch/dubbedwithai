import os
import subprocess

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_1 = os.path.join(home_dir, 'tmp', 'original', 'audio2.mp3')
audio_2 = os.path.join(home_dir, 'tmp', 'subtitle-to-voice', 'audio_00_00_00_00_00_03.mp3')
output_file = os.path.join(home_dir, 'tmp', 'combine-two-audio-streams', 'COMBINED_AUDIO1.mp3')

# Get duration of the first audio file
duration_cmd = f'ffprobe -i "{audio_1}" -show_entries format=duration -v quiet -of csv="p=0"'
duration_1 = float(subprocess.check_output(duration_cmd, shell=True))

# Get duration of the second audio file
duration_cmd = f'ffprobe -i "{audio_2}" -show_entries format=duration -v quiet -of csv="p=0"'
duration_2 = float(subprocess.check_output(duration_cmd, shell=True))

divide_start_time = 0

# ffmpeg_cmd = (
#     f'ffmpeg -i "{audio_1}" -i "{audio_2}" '
#     f'-filter_complex "[0:a]atrim=start=0:end={divide_time},asetpts=PTS-STARTPTS[a1];'
#     f'[1:a]atrim=start=0:end={duration_2},asetpts=PTS-STARTPTS[a2];'
#     f'[a1][a2]concat=n=2:v=0:a=1[outaudio]" '
#     f'-map "[outaudio]" -c:a libmp3lame "{output_file}"'
# )




# ffmpeg_cmd = (
#     f'ffmpeg -hwaccel cuda -hwaccel_device 0 '
#     f'-i "{audio_1}" -i "{audio_2}" '
#     f'-filter_complex "[0:a]afade=t=out:st={start_time}:d={duration_2}[a0];'
#     f'[1:a]atrim=start=0:end={duration_2},asetpts=PTS-STARTPTS[a1];'
#     f'[a0][a1]overlay=enable=\'between(t,{start_time},{start_time+duration_2})\'[outaudio]" '
#     f'-map "[outaudio]" -c:a libmp3lame -c:v hevc_nvenc -preset p7 -rc constqp -qp 25 -tag:v hvc1 "{output_file}"'
# )










ffmpeg_cmd = (
    f'ffmpeg -hwaccel cuda -hwaccel_device 0 '
    f'-i "{audio_1}" -i "{audio_2}" '
    f'-filter_complex "[0:a]atrim=start=0:end={divide_start_time}[audio1_1];'
    f'[0:a]atrim=start={divide_start_time+duration_2}:end={duration_1}[audio1_2];'
    f'[1:a]atrim=start=0:end={duration_2}[audio2_1];'
    f'[audio1_1][audio2_1][audio1_2]concat=n=3:v=0:a=1[outaudio]" '
    f'-map "[outaudio]" -c:a libmp3lame -c:v hevc_nvenc -preset p7 -rc constqp -qp 25 -tag:v hvc1 "{output_file}"'
)

# Construct the ffmpeg command
# ffmpeg_cmd = f'ffmpeg -i "{audio_1}" -i "{audio_2}" -filter_complex "[0:a]atrim=start={divide_start_time}:end={divide_start_time+duration_2}[a1];[1:a]atrim=start=0:end={duration_2}[a2];[a1][a2]concat=n=2:v=0:a=1[outaudio]" -map "[outaudio]" -c:a libmp3lame "{output_file}"'

# Execute the ffmpeg command
subprocess.call(ffmpeg_cmd, shell=True)