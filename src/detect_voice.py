import whisper
import os
import numpy as np
from collections import defaultdict
from pyannote.audio import Pipeline

def detect_voices(audio_file):
    """
    Detects human voices in an audio file using the Whisper model and the pyannote-audio pipeline.
    
    Args:
        audio_file (str): Path to the audio file.
    
    Returns:
        A dictionary where the keys are the speaker names and the values are lists of tuples, 
        where each tuple contains the start and end timestamps (in seconds) of the detected voices.
    """
    # Load the Whisper model
    model = whisper.load_model("base")
    
    # Load the pyannote-audio pipeline for speaker diarization
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token="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")
    
    # Transcribe the audio file using Whisper
    result = model.transcribe(audio_file, fp16=False)
    
    # Extract the detected segments
    segments = result["segments"]
    
    # Filter out non-speech segments
    voice_segments = [seg for seg in segments if seg["text"].strip() != ""]
    
    # Perform speaker diarization using pyannote-audio
    diarization = pipeline(audio_file)
    
    # Group the segments by speaker
    speaker_data = defaultdict(list)
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        start, end, text = turn.start, turn.end, turn.text
        speaker_data[speaker].append((start, end))
    
    return speaker_data

# Example usage
audio_file = r"C:\Users\user\Desktop\Projects\dubbedwithai\tmp\original\sample2.mp3"
speaker_data = detect_voices(audio_file)

print("Detected voices:")
for speaker_name, timestamps in speaker_data.items():
    print(f"{speaker_name}:")
    for start, end, text in timestamps:
        print(f" Voice detected from {start:.2f} to {end:.2f} seconds, {text}")