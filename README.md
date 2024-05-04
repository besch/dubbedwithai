# dubbedwithai

git clone https://github.com/tsurumeso/vocal-remover.git

conda activate some python3.9

pip install torch openai librosa

# if using audio_separator.separator

# https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html#requirements

pip install audio_separator.separator onnx=1.16.0
conda install -c conda-forge cudnn=8.8
conda install -c conda-forge cudatoolkit=11.8
