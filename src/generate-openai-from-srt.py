import os
from openai import OpenAI

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_file = os.path.join(home_dir, 'tmp', 'original', 'audio.mp3')
subtitles_file = os.path.join(home_dir, 'tmp', 'original', 'subtitles.srt')
output_dir = os.path.join(home_dir, 'tmp', 'subtitle-to-voice')

client = OpenAI()
client.api_key = "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"

def extract_subtitles_content_from_srt(filename):
    subtitles_content = []
    with open(filename, 'r') as f:
        lines = f.readlines()
        for index, line in enumerate(lines):
            if line.strip():
                if index % 4 == 1:
                    try:
                        start_time = line.split(" --> ")[0].split(',')[0]
                        end_time = line.split(" --> ")[1].split(',')[0]
                        output_file = os.path.join(output_dir, f"audio_{start_time.replace(':', '_')}_{end_time.replace(':', '_')}.mp3")
                        subtitles_content.append((start_time, end_time, output_file, lines[index + 1].strip()))
                    except (IndexError, ValueError):
                        print(f"Error parsing line: {line}")
                        continue
    return subtitles_content

def api_request(start_time, end_time, output_file, text):
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text
    )
    response.stream_to_file(output_file)

def main():
    subtitles_content = extract_subtitles_content_from_srt(subtitles_file)
    for start_time, end_time, output_file, content in subtitles_content:
        api_request(start_time, end_time, output_file, content)

if __name__ == "__main__":
    main()