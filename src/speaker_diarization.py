from google.cloud import speech_v1p1beta1 as speech
from google.protobuf.json_format import MessageToJson, MessageToDict
import json
from utils import OUTPUT_AUDIO, RESPONSE_DATA

client = speech.SpeechClient()

audio = speech.RecognitionAudio(uri="gs://dubbed_with_ai/audio4m-small.mp3")

diarization_config = speech.SpeakerDiarizationConfig(
    enable_speaker_diarization=True,
    min_speaker_count=2,
    max_speaker_count=6,
)

config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.MP3,  # Change this line
    sample_rate_hertz=48000,
    language_code="pl-PL",
    audio_channel_count=2,
    enable_automatic_punctuation=True,
    diarization_config=diarization_config,
)

print("Waiting for operation to complete...")
operation = client.long_running_recognize(config=config, audio=audio)
response = operation.result()



result = response.results[-1]

words_info = result.alternatives[0].words
print('!!!!!!!!!!!', words_info)

with open(RESPONSE_DATA, 'w') as f:
    f.write(words_info)

# Printing out the output:
# for word_info in words_info:
#     print(f"word: '{word_info.word}', speaker_tag: {word_info.speaker_tag}")
