import os
from dataclasses import dataclass
import cv2
import face_recognition
import pandas as pd
from collections import defaultdict
from utils import extract_subtitles_from_srt, subtitle_to_ms, Subtitle, FACES_DIR

curr_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(curr_dir, "source")
tmp_dir = os.path.join(curr_dir, "tmp")
ORIGINAL_VIDEO = os.path.join(source_dir, 'original_video.mp4')
SUBTITLES = os.path.join(source_dir, 'subtitles.srt')
CSV = os.path.join(tmp_dir, 'final.csv')
take_picture_delay_ms = 300

# Load the known face encodings and names
known_face_encodings = [
    # Add the known face encodings here
]
known_face_names = [
    # Add the corresponding known face names here
]

# Initialize data structures
actors_scenes = defaultdict(list)
scene_summaries = defaultdict(list)

def process_pictures(video, subtitles: list[Subtitle]):
    video = cv2.VideoCapture(str(ORIGINAL_VIDEO))
    
    data = []
    for sub in subtitles:
        sub_time = subtitle_to_ms(sub.start)
        # Extract the frame at the subtitle start time
        video.set(cv2.CAP_PROP_POS_MSEC, sub_time)
        ret, frame = video.read()

        # Detect faces in the frame
        face_locations = face_recognition.face_locations(frame)
        if face_locations:
            face_encodings = face_recognition.face_encodings(frame, face_locations)

            # Compare faces with known faces
            actors = []
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                if any(matches):
                    matched_idxs = [i for i, match in enumerate(matches) if match]
                    names = [known_face_names[i] for i in matched_idxs]
                    name = ", ".join(names)
                else:
                    # Check if the face encoding is already in known_face_encodings
                    if not any(face_recognition.compare_faces(known_face_encodings, face_encoding)):
                        known_face_encodings.append(face_encoding)
                        known_face_names.append(f"Face {len(known_face_encodings)}")
                        name = known_face_names[-1]
                    else:
                        # Find the index of the existing face encoding
                        for i, known_encoding in enumerate(known_face_encodings):
                            if face_recognition.compare_faces([known_encoding], face_encoding)[0]:
                                name = known_face_names[i]
                                break
                actors.append(name)

            # Update data structures
            actors_scenes[tuple(actors)].append(sub.text)
            scene_summaries[tuple(actors)].append(f"Start Time: {sub.start}")

            # Add data to the list
            data.append({
                "Actors": ", ".join(actors),
                "Start Time": sub.start,
                "End Time": sub.end,
                "Content": sub.text
            })

    # Create a pandas DataFrame and save it to a CSV file
    df = pd.DataFrame(data)
    df.to_csv(CSV, index=False)

    # Summarize the data
    for actors, scenes in actors_scenes.items():
        print(f"Actors: {', '.join(actors)}")
        print("Scenes:")
        for scene in scenes:
            print(f"- {scene}")
        print("Scene Summaries:")
        for summary in scene_summaries[actors]:
            print(f"- {summary}")
        print("-" * 20)

    # Release the video capture object
    video.release()
    
    
def main():
    subtitles = extract_subtitles_from_srt(SUBTITLES)
    process_pictures(ORIGINAL_VIDEO, subtitles)

if __name__ == "__main__":
    main()