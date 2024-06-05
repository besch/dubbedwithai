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

# !!!!! important https://github.com/TaoRuijie/TalkNet-ASD.git

pyenv install 3.9
pyenv global 3.9
https://pytorch.org/get-started/locally/
pip install compreface-sdk
pip uninstall numpy scipy pandas
pip install numpy==1.21.6 scipy==1.7.3 pandas==1.3.5 python-dateutil==2.9.0

update demoTalkNet.py

218: \_, audio = wavfile.read(fileName + '.wav') !remove back slash
220: video = cv2.VideoCapture(fileName + '.avi')

# to install compreface you need to run docker in WSL ubuntu

https://github.com/exadel-inc/CompreFace/discussions/918

# convert video file to chrome format so audio is playable

ffmpeg -i input_video.mp4 -c:v copy -c:a aac -b:a 128k output_video.mp4
