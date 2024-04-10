import os
from openai import OpenAI


home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"
audio_file = os.path.join(home_dir, 'tmp', 'original', 'audio.mp3')
subtitles_file = os.path.join(home_dir, 'tmp', 'original', 'subtitles.srt')

output_dir = os.path.join(home_dir, 'tmp', 'subtitle-to-voice')


client = OpenAI()
client.api_key = "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"

def extract_subtitles_content_from_srt(filename):
    with open(filename, 'r') as file:
        lines = file.readlines()

    subtitles_content = []
    current_content = ''
    subtitle_count = 0

    for line in lines:
        line = line.strip()
        if line.isdigit():
            if current_content:
                subtitles_content.append(current_content.strip())
                current_content = ''
                subtitle_count += 1
        elif '-->' in line:
            continue
        elif line:
            current_content += line + ' '

    if current_content:
        subtitles_content.append(current_content.strip())

    return subtitles_content

def api_request(i, text):
    response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input=text
    )

    response.stream_to_file(f"{output_dir}/{i}.mp3")

def main():
    subtitles_content = extract_subtitles_content_from_srt(subtitles_file)
    
    for idx, content in enumerate(subtitles_content, 1):
        api_request(idx, content)

if __name__ == "__main__":
    main()