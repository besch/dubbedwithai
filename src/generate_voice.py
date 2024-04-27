import sys
import json
import os
import torch

current_dir = os.path.dirname(__file__)
sys.path.append(os.path.join(current_dir, 'lib/openvoice'))

from openvoice import se_extractor
from openvoice.api import BaseSpeakerTTS, ToneColorConverter

fields_json = sys.argv[1]
voiceActor, voiceStyle, voiceLanguage, voiceSpeed = json.loads(fields_json)

print(voiceActor, voiceStyle, voiceLanguage, voiceSpeed)

def main():
    print(voiceActor, voiceStyle, voiceLanguage, voiceSpeed)
    return voiceActor
    
if __name__ == "__main__":
    main()
 

# ckpt_base = 'checkpoints/base_speakers/EN'
# ckpt_converter = 'checkpoints/converter'
# device="cuda:0" if torch.cuda.is_available() else "cpu"
# output_dir = 'outputs'

# base_speaker_tts = BaseSpeakerTTS(f'{ckpt_base}/config.json', device=device)
# base_speaker_tts.load_ckpt(f'{ckpt_base}/checkpoint.pth')

# tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
# tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

# os.makedirs(output_dir , exist_ok=True)

# source_se = torch.load(f'{ckpt_base}/en_default_se.pth').to(device)

# reference_speaker = 'resources/demo_speaker2.mp3' # This is the voice you want to clone
# target_se, audio_name = se_extractor.get_se(reference_speaker, tone_color_converter, target_dir='processed', vad=True)

# save_path = f'{output_dir}/output_en_default.wav'

# # Run the base speaker tts
# text = "Random Text Generator is a web application which provides true random text which you can use in your documents or web designs. How does it work?"
# src_path = f'{output_dir}/tmp.wav'
# base_speaker_tts.tts(text, src_path, speaker='default', language='English', speed=1.0)

# # Run the tone color converter
# encode_message = "@MyShell"
# tone_color_converter.convert(
#     audio_src_path=src_path, 
#     src_se=source_se, 
#     tgt_se=target_se, 
#     output_path=save_path,
#     message=encode_message)

# source_se = torch.load(f'{ckpt_base}/en_style_se.pth').to(device)

# voice_styles = ['friendly', 'cheerful', 'excited', 'sad', 'angry', 'terrified', 'shouting', 'whispering']

# for speaker in voice_styles:
#     save_path = f'{output_dir}/output_{speaker}.wav'

#     # Run the base speaker tts
#     src_path = f'{output_dir}/tmp.wav'
#     base_speaker_tts.tts(text, src_path, speaker, language='English', speed=0.9)

#     # friendly, cheerful, excited, sad, angry, terrified, shouting, whispering

#     # Run the tone color converter
#     encode_message = "@MyShell"
#     tone_color_converter.convert(
#         audio_src_path=src_path, 
#         src_se=source_se, 
#         tgt_se=target_se, 
#         output_path=save_path,
#         message=encode_message)
    
    

# ckpt_base = 'checkpoints/base_speakers/ZH'
# base_speaker_tts = BaseSpeakerTTS(f'{ckpt_base}/config.json', device=device)
# base_speaker_tts.load_ckpt(f'{ckpt_base}/checkpoint.pth')

# source_se = torch.load(f'{ckpt_base}/zh_default_se.pth').to(device)
# save_path = f'{output_dir}/output_chinese.wav'

# # Run the base speaker tts
# text = "今天天气真好，我们一起出去吃饭吧。"
# src_path = f'{output_dir}/tmp.wav'
# base_speaker_tts.tts(text, src_path, speaker='default', language='Chinese', speed=1.0)

# # Run the tone color converter
# encode_message = "@MyShell"
# tone_color_converter.convert(
#     audio_src_path=src_path, 
#     src_se=source_se, 
#     tgt_se=target_se, 
#     output_path=save_path,
#     message=encode_message)