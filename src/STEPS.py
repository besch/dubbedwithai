import argparse
from utils import initialize_start_dir
from cut_video_and_subtitles_in_chunks import cut_subtitles_in_chunks_and_filter_images
from face_categorization import categorize_faces
import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
talknet_path = os.path.join(script_dir, 'lib', 'talknet')
sys.path.append(talknet_path)

from lib.talknet import demoTalkNet

def run_demoTalkNet_for_chunks(CHUNKS_DIR):
    chunk_dirs = os.listdir(CHUNKS_DIR)
    chunk_dirs.sort()
    
    for dir in chunk_dirs:
        files = os.listdir(os.path.join(CHUNKS_DIR, dir))
        mp4_files = [f for f in files if f.endswith(".mp4")]
        video_path = os.path.join(CHUNKS_DIR, dir, mp4_files[0])
        subtitles_path = os.path.join(CHUNKS_DIR, dir, "subtitles.srt")
        demoTalkNet.main(video_path, subtitles_path, os.path.join(CHUNKS_DIR, dir))

def main():
    parser = argparse.ArgumentParser(description='Process video and subtitle files')
    parser.add_argument('--video-path', type=str, required=True, help='Path to the video file')
    parser.add_argument('--subtitles-path', type=str, required=True, help='Path to the subtitle file')
    args = parser.parse_args()
    
    video_path = args.video_path
    subtitles_path = args.subtitles_path
    START_DIR, TMP_DIR, CHUNKS_DIR, TALKNET_DIR, FACES_DIR, FACES_COPY_DIR, CATEGORIZED_FACES_DIR = initialize_start_dir(video_path)
    demoTalkNet.main(video_path, subtitles_path, TALKNET_DIR)
    cut_subtitles_in_chunks_and_filter_images(subtitles_path, CHUNKS_DIR)
    categorize_faces(FACES_DIR, CATEGORIZED_FACES_DIR)

if __name__ == '__main__':
    main()
