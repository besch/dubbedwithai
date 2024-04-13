import os
import subprocess

home_dir = r"C:\Users\user\Desktop\Projects\dubbedwithai"

input_dir = os.path.join(home_dir, 'tmp', 'extract-subtitle-audio')
output_dir = os.path.join(home_dir, 'tmp', 'audio-remove-vocals')

vocal_remover = os.path.join(home_dir, 'vocal_remover', 'inference.py')

def run_inference(input_file):
    command = f"python {vocal_remover} --input {input_file} --output_dir {output_dir} --gpu 0"
    subprocess.run(command, shell=True)

def main():
    with os.scandir(input_dir) as entries:
        for entry in entries:
            if entry.is_file():
                run_inference(entry.path)

if __name__ == "__main__":
    main()