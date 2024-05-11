import json
import tkinter as tk
from PIL import ImageTk, Image
from utils import CATEGORIZED_DIR, UPDATED_RESPONSE_DATA
import os

# Load the JSON data
with open(UPDATED_RESPONSE_DATA, 'r') as file:
    data = json.load(file)

# Create a Tkinter window
window = tk.Tk()
window.title("Timeline Visualization")

# Create a canvas to display the timeline
canvas = tk.Canvas(window, width=800, height=600)
canvas.pack()

# Sort the data by "start" time
data.sort(key=lambda x: x["start"])

# Create a dictionary to store speaker images
speaker_images = {}

# Function to load and cache speaker images
def load_speaker_image(speaker):
    if speaker not in speaker_images:
        try:
            image = Image.open(speaker).resize((50, 50), Image.LANCZOS)
            speaker_images[speaker] = ImageTk.PhotoImage(image)
        except Exception as e:
            print(f"Error loading image for speaker {speaker}: {e}")
            speaker_images[speaker] = None
    return speaker_images[speaker]

# Variables to track the current position and height
current_y = 10
row_height = 50  # Set the row height to 35 pixels

# Iterate over the sorted data and create text and image items
for item in data:
    text = f"{item['text']} (Start: {item['start']})"

    for face_folder in os.listdir(CATEGORIZED_DIR):
        if face_folder == item["speaker"]:
            speaker = os.listdir(os.path.join(CATEGORIZED_DIR, face_folder))[0]
            speaker_image_path = os.path.join(CATEGORIZED_DIR, face_folder, speaker)

            # Load the speaker image
            speaker_image = load_speaker_image(speaker_image_path)

            # Create an image item if the speaker image is available
            if speaker_image:
                image_item = canvas.create_image(10, current_y, anchor="nw", image=speaker_image)

            # Create a text item
            text_item = canvas.create_text(70, current_y, anchor="nw", text=text)

            # Move to the next position
            current_y += row_height

# Configure the canvas scrollbar
canvas.configure(scrollregion=canvas.bbox("all"))

# Run the Tkinter event loop
window.mainloop()