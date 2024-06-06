# import pickle
# import matplotlib.pyplot as plt
# import pandas as pd

# file = r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\pywork\tracks.pckl"

# # Open the .pkl file in binary read mode
# with open(file, 'rb') as f:
#     # Load and deserialize the object
#     obj = pickle.load(f)
    
#     print(obj[19])

#     # # Assuming obj is a Pandas DataFrame
#     # if isinstance(obj, pd.DataFrame):
#     #     obj.plot() # Or any other Pandas plotting function
#     #     plt.show()

from utils import extract_face_from_image, FACES_DIR
from face_verification import detect_face
from collections import defaultdict
import json
import os

with open(r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\dump.json", 'r') as f:
    data = json.load(f)

    entries_dict = defaultdict(dict)

    # Iterate through the printed_entries list
    for entry in data:
        # Get the key for the dictionary
        key = (entry['time_start_srt'], entry['track'])
        
        # Check if the key exists in the dictionary
        if key in entries_dict:
            # If it exists, compare the scores and keep the entry with the highest score
            # if entry['score'] > entries_dict[key]['score'] and detect_face(entry['image_path'], entry['box']):
            if entry['score'] > entries_dict[key]['score']:
                entries_dict[key] = entry
        else:
            # If the key doesn't exist, add the entry to the dictionary
            entries_dict[key] = entry

    # Convert the dictionary values to a list
    filtered_entries = list(entries_dict.values())
    
    with open(r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\dump_processes.json", 'w') as f:
        json.dump(filtered_entries, f)
    
    
    for entry in filtered_entries:
        output_path = os.path.join(r"C:\Users\user\Desktop\Projects\talknet\TalkNet-ASD\demo\video\pyframes_face", f"{entry['time_start_ms']}.jpg")
        extract_face_from_image(entry['image_path'], entry['box'], output_path)