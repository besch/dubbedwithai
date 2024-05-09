# dubbedwithai

conda activate some python3.9

pip install torch openai librosa

# if using audio_separator.separator

# https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html#requirements

pip install audio_separator.separator onnx=1.16.0
conda install -c conda-forge cudnn=8.8
conda install -c conda-forge cudatoolkit=11.8

# https://github.com/m-bain/whisperX

# work with images

https://stackoverflow.com/questions/50951955/pytesseract-tesseractnotfound-error-tesseract-is-not-installed-or-its-not-i
https://github.com/UB-Mannheim/tesseract/wiki install
conda install -c conda-forge dlib
pip install cmake
pip install face_recognition

# gender, age detection. Download models and reference them in gender_detection.py

https://github.com/smahesh29/Gender-and-Age-Detection/blob/master/gender_net.caffemodel
https://github.com/smahesh29/Gender-and-Age-Detection/blob/master/gender_deploy.prototxt
