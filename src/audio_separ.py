from audio_separator.separator import Separator

separator = Separator()
separator.load_model(model_filename='UVR-MDX-NET-Inst_HQ_3.onnx')

output_file_paths = separator.separate(r"C:\Users\user\Desktop\Projects\dubbedwithai\src\source\audio - Copy.wav")

# The separated vocals will be saved as the first output file
vocals_file = output_file_paths[1]
