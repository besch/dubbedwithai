import os
import base64
import json
from utils import extract_subtitles_from_srt, Subtitle, subtitle_to_ms, openai_client, ORIGINAL_VIDEO, SUBTITLES, PICTURES, VISION

take_picture_delay_ms = 300
number_of_pictures_to_process = 10

def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

def req():
    # Get the first 10 images from the "images" directory
    image_files = os.listdir(PICTURES)[2:number_of_pictures_to_process]
    image_urls = [f"data:image/jpeg;base64,{encode_image(os.path.join(PICTURES, f))}" for f in image_files]

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": """
                        Find people(Actor) in images that appear on one or multiple images; give Actor a dummy name like Bob, Anna, etc.; 
                        repond in json with: 
                            - Actor name 
                            - the exact file names of images in which the actor was found
                            - a concise Actor face description and manner
                    """,
                },
                *[
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": url,
                        },
                    }
                    for url in image_urls
                ],
            ],
        }
    ]
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=messages,
            max_tokens=300,
        )
        content = response.choices[0].message.content
        print(content)
        
        with open(VISION, "w") as f:
            f.write(content)
    except Exception as e:
        print(e)
        return

    
    return response.choices[0]

req()
