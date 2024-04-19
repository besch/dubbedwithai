# server/utils/convert-video.py
import sys
import moviepy.editor as mp

# Get command-line arguments
video_path = sys.argv[1]
audio_path = sys.argv[2]

# Load the video
video = mp.VideoFileClip(video_path)

# Extract audio from the video
audio = video.audio

# Write the audio to an MP3 file
audio.write_audiofile(audio_path)

# Close the video file
video.close()