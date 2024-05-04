# from openai import OpenAI
# client = OpenAI()

# audio_file = open(r"C:\Users\user\Desktop\Projects\dubbedwithai\src\source\audio - Copy.wav", "rb")
# transcription = client.audio.transcriptions.create(
#   model="whisper-1", 
#   file=audio_file,
#   response_format="srt"
# )
# print(transcription)


from openai import OpenAI
client = OpenAI()

audio_file = open(r"C:\Users\user\Desktop\Projects\dubbedwithai\src\source\audio - Copy.wav", "rb")
transcript = client.audio.translations.create(
  model="whisper-1",
  file=audio_file,
  response_format="srt"
)
print(transcript)
