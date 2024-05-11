import json
from collections import defaultdict
from utils import FACE_VERIFICATION, RESPONSE_DATA, UPDATED_RESPONSE_DATA

# Load JSON files
with open(FACE_VERIFICATION, "r") as file:
    face_data = json.load(file)

with open(RESPONSE_DATA, "r") as file:
    response_data = json.load(file)

face_dict = defaultdict(list)
for entry in face_data:
    face_dict[entry["start"]].append(entry["speaker"])

# Create a dictionary to map old speakers to new speakers
speaker_map = {}

# Update response_data.json with face_verification.json data
for entry in response_data:
    start_time = entry["start"]
    old_speaker = entry["speaker"]
    for tolerance in range(-500, 501):
        match_time = start_time + tolerance
        if match_time in face_dict:
            new_speaker = face_dict[match_time][0]
            if old_speaker != new_speaker:
                speaker_map[old_speaker] = new_speaker
                entry["speaker"] = new_speaker
            break

# Update all entries with the new speaker values
for entry in response_data:
    if entry["speaker"] in speaker_map:
        entry["speaker"] = speaker_map[entry["speaker"]]

# Save the updated response_data.json
with open(UPDATED_RESPONSE_DATA, "w") as file:
    json.dump(response_data, file, indent=2)