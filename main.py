import os
from openai import OpenAI

input_dir = r"C:\Users\user\Downloads\Gorod.Boga.2002.DUAL.BDRip.XviD.AC3.-Shevon"
input_file = "Gorod.Boga.2002.DUAL.BDRip.XviD.AC3.-Shevon.ENG.srt"

output_dir = os.path.join(input_dir, "first-10-voices")

client = OpenAI()
client.api_key = "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"

def extract_subtitles_content_from_srt(filename, num_subtitles=10):
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
                if subtitle_count >= num_subtitles:
                    break
        elif '-->' in line:
            continue
        elif line:
            current_content += line + ' '

    if current_content and subtitle_count < num_subtitles:
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
    filename = f'{input_dir}\{input_file}'
    subtitles_content = extract_subtitles_content_from_srt(filename, num_subtitles=10)
    
    for idx, content in enumerate(subtitles_content, 1):
        api_request(idx, content)

if __name__ == "__main__":
    main()