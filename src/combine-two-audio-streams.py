import os
import subprocess

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_1 = os.path.join(home_dir, 'tmp', 'audio-remove-vocals', 'audio_00_00_49_00_00_50_Instruments.wav')
audio_2 = os.path.join(home_dir, 'tmp', 'subtitle-to-voice', 'audio_00_00_49_00_00_50.mp3')

output_dir = os.path.join(home_dir, 'tmp', 'combine-two-audio-streams')
output_file = os.path.join(output_dir, 'combined_audio.mp3')

def main():
    ffmpeg_cmd = (f'ffmpeg -hwaccel cuda -hwaccel_device 0 '
            f'-i "{audio_1}" -i "{audio_2}" '
            f'-filter_complex "[0:a][1:a]amerge=inputs=2[aout]" '
            f'-map "[aout]" -c:a libmp3lame -c:v hevc_nvenc -preset p7 -rc constqp -qp 25 -tag:v hvc1 "{output_file}"')
    subprocess.call(ffmpeg_cmd, shell=True)
    print(f"Audio files combined successfully: {output_file}")

if __name__ == "__main__":
    main()