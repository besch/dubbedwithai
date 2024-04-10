import os
import subprocess

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_file = os.path.join(home_dir, 'tmp', 'original', 'audio.mp3')
subtitles_file = os.path.join(home_dir, 'tmp', 'original', 'subtitles.srt')

output_dir = os.path.join(home_dir, 'tmp', 'extract-subtitle-audio')


def extract_audio(input_file, output_file, start_time, end_time):
    ffmpeg_command = [
        "ffmpeg",
        "-i", input_file,
        "-ss", start_time,
        "-to", end_time,
        "-acodec", "copy",
        "-f", "mp3",
        output_file
    ]
    try:
        subprocess.run(ffmpeg_command, check=True, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e.stderr.decode().strip()}")
        raise e

def main():
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(subtitles_file, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
        index = 0
        while index < len(lines):
            line = lines[index].strip()
            print('!!!!!!!!!!', line)
            if line.isdigit():
                # Get start and end times without milliseconds
                start_time = lines[index+1].split(" --> ")[0].split(',')[0]
                end_time = lines[index+1].split(" --> ")[1].split(',')[0]
                
                # Generate output file name
                output_file = os.path.join(output_dir, f"audio_{start_time.replace(':', '_')}_{end_time.replace(':', '_')}.mp3")
                
                # Extract audio
                try:
                    extract_audio(audio_file, output_file, start_time, end_time)
                    print(f"Extracted audio from {start_time} to {end_time} into {output_file}")
                except Exception as e:
                    print(f"Error extracting audio: {e}")

                # Move to next subtitle
                index += 4  # Skip 4 lines for each subtitle entry
            else:
                index += 1

if __name__ == "__main__":
    main()