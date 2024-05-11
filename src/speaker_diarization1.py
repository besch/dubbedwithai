import assemblyai as aai
import json
import os
import datetime
from utils import RESPONSE_DATA

aai.settings.api_key = "ee975ba2774e41b1828863d4778e7ac7"
FILE_URL = r"C:\Users\user\Desktop\Projects\dubbedwithai\tmp\original\16m.ac3"
config = aai.TranscriptionConfig(speaker_labels=True, language_code="pl", entity_detection=True)

request_start_time = datetime.datetime.now()

transcriber = aai.Transcriber()
transcript = transcriber.transcribe(
  FILE_URL,
  config=config
)

request_end_time = datetime.datetime.now()

transcription_data = []

for utterance in transcript.utterances:
    transcription_data.append({
        "start": utterance.start,
        "end": utterance.end,
        "confidence": utterance.confidence,
        "speaker": utterance.speaker,
        "text": utterance.text
    })
    
    # print(f"Start: {utterance.start}, end {utterance.end}. Confidence: {utterance.confidence},  Speaker {utterance.speaker}: {utterance.text}")

if os.path.exists(RESPONSE_DATA):
    os.remove(RESPONSE_DATA)

print('!!!!!!!!!!!!', transcription_data)

with open(RESPONSE_DATA, "w") as f:
    json.dump(transcription_data, f, indent=4)
    
print(f"Request started at: {request_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Request ended at: {request_end_time.strftime('%Y-%m-%d %H:%M:%S')}")