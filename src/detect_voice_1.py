import os
from google.cloud import speech_v1

# Set the GOOGLE_CLOUD_PROJECT environment variable
os.environ['GOOGLE_CLOUD_PROJECT'] = 'chrome-extension-rating-411421'

client = speech_v1.SpeechClient()

speech_file = r"C:\Users\user\Desktop\Projects\dubbedwithai\tmp\original\sample2.mp3"
with open(speech_file, "rb") as audio_file:
    content = audio_file.read()

audio = speech_v1.RecognitionAudio(content=content)

diarization_config = speech_v1.SpeakerDiarizationConfig(
    enable_speaker_diarization=True,
    min_speaker_count=0,
    max_speaker_count=10,
)

config = speech_v1.RecognitionConfig(
    encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=8000,
    language_code="pt",
    diarization_config=diarization_config,
)

print("Waiting for operation to complete...")
response = client.recognize(config=config, audio=audio)

# The transcript within each result is separate and sequential per result.
# However, the alternatives list within a result includes all the alternatives
# for that result. To get all the words with speaker tags, you need to
# iterate through the results and the alternatives within each result.

print(response.results)

for result in response.results:
    for alternative in result.alternatives:
        for word_info in alternative.words:
            print(f"word: '{word_info.word}', speaker_tag: {word_info.speaker_tag}")
