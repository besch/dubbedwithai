import face_recognition
import cv2
import numpy as np

# Load the image
image = face_recognition.load_image_file(r"C:\Users\user\Desktop\Projects\dubbedwithai\src\tmp\categorized\102239\107640.jpg")

# Get the face locations
face_locations = face_recognition.face_locations(image)

# Load a pre-trained gender classification model
gender_proto = r"C:\Users\user\Desktop\Projects\dubbedwithai\src\lib\gender_age_detection\gender_deploy.prototxt"
gender_model = r"C:\Users\user\Desktop\Projects\dubbedwithai\src\lib\gender_age_detection\gender_net.caffemodel"
gender_net = cv2.dnn.readNet(gender_model, gender_proto)

# Loop through each face location
for top, right, bottom, left in face_locations:
    # Extract the face region from the image
    face_image = image[top:bottom, left:right]

    # Prepare the input blob for the gender model
    gender_blob = cv2.dnn.blobFromImage(face_image, size=(227, 227))

    # Pass the blob through the gender model
    gender_net.setInput(gender_blob)
    gender_preds = gender_net.forward()

    # Get the predicted gender
    if gender_preds[0][0] > gender_preds[0][1]:
        gender = "Male"
    else:
        gender = "Female"

    print(f"Predicted gender: {gender}")