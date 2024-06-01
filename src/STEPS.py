import argparse
from utils import initialize_start_dir, sort_dirs_by_num_of_files
from cut_video_and_subtitles_in_chunks import cut_subtitles_in_chunks_and_filter_images
from face_categorization import categorize_faces, find_similar_faces_in_directories, find_similar_faces_in_directories_to_json
import os
import sys

# script_dir = os.path.dirname(os.path.abspath(__file__))
# talknet_path = os.path.join(script_dir, 'lib', 'talknet')
# sys.path.append(talknet_path)

# from lib.talknet import demoTalkNet

def main():
    parser = argparse.ArgumentParser(description='Process video and subtitle files')
    parser.add_argument('--video-path', type=str, required=True, help='Path to the video file')
    parser.add_argument('--subtitles-path', type=str, required=True, help='Path to the subtitle file')
    args = parser.parse_args()
    
    video_path = args.video_path
    subtitles_path = args.subtitles_path
    # START_DIR, TMP_DIR, CHUNKS_DIR, TALKNET_DIR = initialize_start_dir(video_path)
    # demoTalkNet.main(video_path, subtitles_path, TALKNET_DIR)
    # cut_subtitles_in_chunks_and_filter_images(subtitles_path, CHUNKS_DIR)
    
    # CHUNKS_DIR = r"C:\Users\user\Downloads\chlopaki_nie_placza\tmp\chunks"
    # for chunk_dir in os.listdir(CHUNKS_DIR):
    #     FACES_DIR = (os.path.join(CHUNKS_DIR, chunk_dir, 'faces'))
    #     categorize_faces(FACES_DIR)
    
    # find_similar_faces_in_directories(CHUNKS_DIR)
    
    
    
    CHUNKS_DIR = r"C:\Users\user\Downloads\chlopaki_nie_placza\tmp\chunks"
    OUTPUT_JSON_PATH = r"C:\Users\user\Downloads\chlopaki_nie_placza\output.json"
    find_similar_faces_in_directories_to_json(CHUNKS_DIR, OUTPUT_JSON_PATH)
    
    

if __name__ == '__main__':
    main()

    
    
    
    
    
    


    # cut_in_chunks(video_path, subtitles_path, CHUNKS_DIR)
    # CHUNKS_DIR = r"C:\Users\user\Downloads\chlopaki_nie_placza\tmp\chunks"
    # run_demoTalkNet_for_chunks(CHUNKS_DIR)

    # files = os.listdir(os.path.join(CHUNKS_DIR, dir))
    # mp4_files = [f for f in files if f.endswith(".mp4")]
    # video_path = os.path.join(CHUNKS_DIR, dir, mp4_files[0])
    # subtitles_path = os.path.join(CHUNKS_DIR, dir, "subtitles.srt")