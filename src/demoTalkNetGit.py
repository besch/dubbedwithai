import sys, time, os, tqdm, torch, argparse, glob, subprocess, warnings, cv2, pickle, numpy, pdb, math, python_speech_features
import pysrt
import json
from scipy import signal
from shutil import rmtree
from scipy.io import wavfile
from scipy.interpolate import interp1d
from sklearn.metrics import accuracy_score, f1_score
from collections import defaultdict

from scenedetect.video_manager import VideoManager
from scenedetect.scene_manager import SceneManager
from scenedetect.frame_timecode import FrameTimecode
from scenedetect.stats_manager import StatsManager
from scenedetect.detectors import ContentDetector

from s3fd import S3FD
from talkNet import talkNet

warnings.filterwarnings("ignore")

args = {}

def scene_detect(args):
	# CPU: Scene detection, output is the list of each shot's time duration
	videoManager = VideoManager([args['videoFilePath']])
	statsManager = StatsManager()
	sceneManager = SceneManager(statsManager)
	sceneManager.add_detector(ContentDetector())
	baseTimecode = videoManager.get_base_timecode()
	videoManager.set_downscale_factor()
	videoManager.start()
	sceneManager.detect_scenes(frame_source = videoManager)
	sceneList = sceneManager.get_scene_list(baseTimecode)
	savePath = os.path.join(args['pyworkPath'], 'scene.pckl')
	if sceneList == []:
		sceneList = [(videoManager.get_base_timecode(),videoManager.get_current_timecode())]
	with open(savePath, 'wb') as fil:
		pickle.dump(sceneList, fil)
		sys.stderr.write('%s - scenes detected %d\n'%(args['videoFilePath'], len(sceneList)))
	return sceneList

def inference_video(args):
	# GPU: Face detection, output is the list contains the face location and score in this frame
	DET = S3FD(device='cuda')
	flist = glob.glob(os.path.join(args['pyframesPath'], '*.jpg'))
	flist.sort()
	dets = []
	for fidx, fname in enumerate(flist):
		image = cv2.imread(fname)
		imageNumpy = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
		bboxes = DET.detect_faces(imageNumpy, conf_th=0.9, scales=[args['facedetScale']])
		dets.append([])
		for bbox in bboxes:
			dets[-1].append({'frame':fidx, 'bbox':(bbox[:-1]).tolist(), 'conf':bbox[-1]}) # dets has the frames info, bbox info, conf info
		sys.stderr.write('%s-%05d; %d dets\r' % (args['videoFilePath'], fidx, len(dets[-1])))
	savePath = os.path.join(args['pyworkPath'],'faces.pckl')
	with open(savePath, 'wb') as fil:
		pickle.dump(dets, fil)
	return dets

def bb_intersection_over_union(boxA, boxB, evalCol = False):
	# CPU: IOU Function to calculate overlap between two image
	xA = max(boxA[0], boxB[0])
	yA = max(boxA[1], boxB[1])
	xB = min(boxA[2], boxB[2])
	yB = min(boxA[3], boxB[3])
	interArea = max(0, xB - xA) * max(0, yB - yA)
	boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
	boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
	if evalCol == True:
		iou = interArea / float(boxAArea)
	else:
		iou = interArea / float(boxAArea + boxBArea - interArea)
	return iou

def track_shot(args, sceneFaces):
	# CPU: Face tracking
	iouThres  = 0.5     # Minimum IOU between consecutive face detections
	tracks    = []
	while True:
		track     = []
		for frameFaces in sceneFaces:
			for face in frameFaces:
				if track == []:
					track.append(face)
					frameFaces.remove(face)
				elif face['frame'] - track[-1]['frame'] <= args['numFailedDet']:
					iou = bb_intersection_over_union(face['bbox'], track[-1]['bbox'])
					if iou > iouThres:
						track.append(face)
						frameFaces.remove(face)
						continue
				else:
					break
		if track == []:
			break
		elif len(track) > args['minTrack']:
			frameNum    = numpy.array([ f['frame'] for f in track ])
			bboxes      = numpy.array([numpy.array(f['bbox']) for f in track])
			frameI      = numpy.arange(frameNum[0],frameNum[-1]+1)
			bboxesI    = []
			for ij in range(0,4):
				interpfn  = interp1d(frameNum, bboxes[:,ij])
				bboxesI.append(interpfn(frameI))
			bboxesI  = numpy.stack(bboxesI, axis=1)
			if max(numpy.mean(bboxesI[:,2]-bboxesI[:,0]), numpy.mean(bboxesI[:,3]-bboxesI[:,1])) > args['minFaceSize']:
				tracks.append({'frame':frameI,'bbox':bboxesI})
	return tracks

def crop_video(args, track, cropFile):
	# CPU: crop the face clips
	flist = glob.glob(os.path.join(args['pyframesPath'], '*.jpg')) # Read the frames
	flist.sort()
	vOut = cv2.VideoWriter(cropFile + 't.avi', cv2.VideoWriter_fourcc(*'XVID'), 25, (224,224))# Write video
	dets = {'x':[], 'y':[], 's':[]}
	for det in track['bbox']: # Read the tracks
		dets['s'].append(max((det[3]-det[1]), (det[2]-det[0]))/2) 
		dets['y'].append((det[1]+det[3])/2) # crop center x 
		dets['x'].append((det[0]+det[2])/2) # crop center y
	dets['s'] = signal.medfilt(dets['s'], kernel_size=13)  # Smooth detections 
	dets['x'] = signal.medfilt(dets['x'], kernel_size=13)
	dets['y'] = signal.medfilt(dets['y'], kernel_size=13)
	for fidx, frame in enumerate(track['frame']):
		cs  = args['cropScale']
		bs  = dets['s'][fidx]   # Detection box size
		bsi = int(bs * (1 + 2 * cs))  # Pad videos by this amount 
		image = cv2.imread(flist[frame])
		frame = numpy.pad(image, ((bsi,bsi), (bsi,bsi), (0, 0)), 'constant', constant_values=(110, 110))
		my  = dets['y'][fidx] + bsi  # BBox center Y
		mx  = dets['x'][fidx] + bsi  # BBox center X
		face = frame[int(my-bs):int(my+bs*(1+2*cs)),int(mx-bs*(1+cs)):int(mx+bs*(1+cs))]
		vOut.write(cv2.resize(face, (224, 224)))
	audioTmp    = cropFile + '.wav'
	audioStart  = (track['frame'][0]) / 25
	audioEnd    = (track['frame'][-1]+1) / 25
	vOut.release()
	command = ("ffmpeg -y -i %s -async 1 -ac 1 -vn -acodec pcm_s16le -ar 16000 -threads %d -ss %.3f -to %.3f %s -loglevel panic" % \
		      (args['audioFilePath'], args['nDataLoaderThread'], audioStart, audioEnd, audioTmp)) 
	output = subprocess.call(command, shell=True, stdout=None) # Crop audio file
	_, audio = wavfile.read(audioTmp)
	command = ("ffmpeg -y -i %st.avi -i %s -threads %d -c:v copy -c:a copy %s.avi -loglevel panic" % \
			  (cropFile, audioTmp, args['nDataLoaderThread'], cropFile)) # Combine audio and video file
	output = subprocess.call(command, shell=True, stdout=None)
	os.remove(cropFile + 't.avi')
	return {'track':track, 'proc_track':dets}

def extract_MFCC(file, outPath):
	# CPU: extract mfcc
	sr, audio = wavfile.read(file)
	mfcc = python_speech_features.mfcc(audio,sr) # (N_frames, 13)   [1s = 100 frames]
	featuresPath = os.path.join(outPath, file.split('/')[-1].replace('.wav', '.npy'))
	numpy.save(featuresPath, mfcc)

def evaluate_network(files, args):
	# GPU: active speaker detection by pretrained TalkNet
	s = talkNet()
	s.loadParameters(args['pretrainModel'])
	sys.stderr.write("Model %s loaded from previous state! \r\n"%args['pretrainModel'])
	s.eval()
	allScores = []
	# durationSet = {1,2,4,6} # To make the result more reliable
	durationSet = {1,1,1,2,2,2,3,3,4,5,6} # Use this line can get more reliable result
	for file in tqdm.tqdm(files, total = len(files)):
		fileName = os.path.splitext(file.split('/')[-1])[0] # Load audio and video
		_, audio = wavfile.read(fileName + '.wav')
		audioFeature = python_speech_features.mfcc(audio, 16000, numcep = 13, winlen = 0.025, winstep = 0.010)
		video = cv2.VideoCapture(fileName + '.avi')
		videoFeature = []
		while video.isOpened():
			ret, frames = video.read()
			if ret == True:
				face = cv2.cvtColor(frames, cv2.COLOR_BGR2GRAY)
				face = cv2.resize(face, (224,224))
				face = face[int(112-(112/2)):int(112+(112/2)), int(112-(112/2)):int(112+(112/2))]
				videoFeature.append(face)
			else:
				break
		video.release()
		videoFeature = numpy.array(videoFeature)
		length = min((audioFeature.shape[0] - audioFeature.shape[0] % 4) / 100, videoFeature.shape[0] / 25)
		audioFeature = audioFeature[:int(round(length * 100)),:]
		videoFeature = videoFeature[:int(round(length * 25)),:,:]
		allScore = [] # Evaluation use TalkNet
		for duration in durationSet:
			batchSize = int(math.ceil(length / duration))
			scores = []
			with torch.no_grad():
				for i in range(batchSize):
					inputA = torch.FloatTensor(audioFeature[i * duration * 100:(i+1) * duration * 100,:]).unsqueeze(0).cuda()
					inputV = torch.FloatTensor(videoFeature[i * duration * 25: (i+1) * duration * 25,:,:]).unsqueeze(0).cuda()
					embedA = s.model.forward_audio_frontend(inputA)
					embedV = s.model.forward_visual_frontend(inputV)	
					embedA, embedV = s.model.forward_cross_attention(embedA, embedV)
					out = s.model.forward_audio_visual_backend(embedA, embedV)
					score = s.lossAV.forward(out, labels = None)
					scores.extend(score)
			allScore.append(scores)
		allScore = numpy.round((numpy.mean(numpy.array(allScore), axis = 0)), 1).astype(float)
		allScores.append(allScore)	
	return allScores

def visualization(tracks, scores, args, subtitlesPath):
	subtitles = read_subtitles(subtitlesPath)
	subtitles_start_time_frames = [milliseconds_to_frame(x[0]) for x in subtitles]
	subtitles_end_time_frames = [milliseconds_to_frame(x[1]) for x in subtitles]
	subtitle_texts = [x[2] for x in subtitles]

	flist = glob.glob(os.path.join(args['pyframesPath'], '*.jpg'))
	flist.sort()
	faces = [[] for i in range(len(flist))]
 
	printed_entries = []

	for tidx, track in enumerate(tracks):
		score = scores[tidx]
		for fidx, frame in enumerate(track['track']['frame'].tolist()):
			s = score[max(fidx - 2, 0): min(fidx + 3, len(score) - 1)]
			s = numpy.mean(s)
			faces[frame].append({'track':tidx,'score':float(s),'s':track['proc_track']['s'][fidx], 'x':track['proc_track']['x'][fidx], 'y':track['proc_track']['y'][fidx]})

			for i, (start_frame, end_frame) in enumerate(zip(subtitles_start_time_frames, subtitles_end_time_frames)):
				if start_frame <= frame <= end_frame:
					start_ms = subtitles[i][0]
					end_ms = subtitles[i][1]
					for face in faces[frame]:
						if face['score'] > 0.2:
							printed_entries.append({
								'time_start_ms': start_ms,
								'time_start_srt': ms_to_subtitle_time(start_ms),
								'time_end_ms': end_ms,
								'time_end_srt': ms_to_subtitle_time(end_ms),
								'frame': frame,
								'track': face['track'],
								'score': face['score'],
								'image_path': os.path.abspath(flist[frame]),
								'box': {
									'x_min': int(face['x']-face['s']), 
									'y_min': int(face['y']-face['s']),
									'x_max': int(face['x']+face['s']), 
									'y_max': int(face['y']+face['s'])
								},
								'subtitle_text': subtitle_texts[i]
							})

	filter_duplicate_frames(printed_entries)

	# firstImage = cv2.imread(flist[0])
	# fw = firstImage.shape[1]
	# fh = firstImage.shape[0]
	# vOut = cv2.VideoWriter(os.path.join(args['pyaviPath'], 'video_only.avi'), cv2.VideoWriter_fourcc(*'XVID'), 25, (fw,fh))
	# colorDict = {0: 0, 1: 255}
	# for fidx, fname in tqdm.tqdm(enumerate(flist), total = len(flist)):
	# 	image = cv2.imread(fname)
	# 	for face in faces[fidx]:
	# 		clr = colorDict[int((face['score'] >= 0))]
	# 		txt = round(face['score'], 1)
	# 		cv2.rectangle(image, (int(face['x']-face['s']), int(face['y']-face['s'])), (int(face['x']+face['s']), int(face['y']+face['s'])),(0,clr,255-clr),10)
	# 		cv2.putText(image,'%s'%(txt), (int(face['x']-face['s']), int(face['y']-face['s'])), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,clr,255-clr),5)
	# 	vOut.write(image)
	# 	# image_name = fname.split('\\')[-1]
	# 	# image_path = os.path.join(args['pyframesFacePath'], image_name)
	# 	# cv2.imwrite(image_path, image)
	# vOut.release()
	# command = ("ffmpeg -y -i %s -i %s -threads %d -c:v copy -c:a copy %s -loglevel panic" % \
	# 	(os.path.join(args['pyaviPath'], 'video_only.avi'), os.path.join(args['pyaviPath'], 'audio.wav'), \
	# 	args['nDataLoaderThread'], os.path.join(args['pyaviPath'],'video_out.avi'))) 
	# output = subprocess.call(command, shell=True, stdout=None)

def evaluate_col_ASD(tracks, scores, args):
	txtPath = os.path.join(args['videoFolder'], 'col_labels', 'fusion', '*.txt') # Load labels
	predictionSet = {}
	for name in {'long', 'bell', 'boll', 'lieb', 'sick', 'abbas'}:
		predictionSet[name] = [[],[]]
	dictGT = {}
	txtFiles = glob.glob("%s"%txtPath)
	for file in txtFiles:
		lines = open(file).read().splitlines()
		idName = file.split('/')[-1][:-4]
		for line in lines:
			data = line.split('\t')
			frame = int(int(data[0]) / 29.97 * 25)
			x1 = int(data[1])
			y1 = int(data[2])
			x2 = int(data[1]) + int(data[3])
			y2 = int(data[2]) + int(data[3])
			gt = int(data[4])
			if frame in dictGT:
				dictGT[frame].append([x1,y1,x2,y2,gt,idName])
			else:
				dictGT[frame] = [[x1,y1,x2,y2,gt,idName]]	
	flist = glob.glob(os.path.join(args['pyframesPath'], '*.jpg')) # Load files
	flist.sort()
	faces = [[] for i in range(len(flist))]
	for tidx, track in enumerate(tracks):
		score = scores[tidx]				
		for fidx, frame in enumerate(track['track']['frame'].tolist()):
			s = numpy.mean(score[max(fidx - 2, 0): min(fidx + 3, len(score) - 1)]) # average smoothing
			faces[frame].append({'track':tidx, 'score':float(s),'s':track['proc_track']['s'][fidx], 'x':track['proc_track']['x'][fidx], 'y':track['proc_track']['y'][fidx]})
	for fidx, fname in tqdm.tqdm(enumerate(flist), total = len(flist)):
		if fidx in dictGT: # This frame has label
			for gtThisFrame in dictGT[fidx]: # What this label is ?
				faceGT = gtThisFrame[0:4]
				labelGT = gtThisFrame[4]
				idGT = gtThisFrame[5]
				ious = []
				for face in faces[fidx]: # Find the right face in my result
					faceLocation = [int(face['x']-face['s']), int(face['y']-face['s']), int(face['x']+face['s']), int(face['y']+face['s'])]
					faceLocation_new = [int(face['x']-face['s']) // 2, int(face['y']-face['s']) // 2, int(face['x']+face['s']) // 2, int(face['y']+face['s']) // 2]
					iou = bb_intersection_over_union(faceLocation_new, faceGT, evalCol = True)
					if iou > 0.5:
						ious.append([iou, round(face['score'],2)])
				if len(ious) > 0: # Find my result
					ious.sort()
					labelPredict = ious[-1][1]
				else:					
					labelPredict = 0
				x1 = faceGT[0]
				y1 = faceGT[1]
				width = faceGT[2] - faceGT[0]
				predictionSet[idGT][0].append(labelPredict)
				predictionSet[idGT][1].append(labelGT)
	names = ['long', 'bell', 'boll', 'lieb', 'sick', 'abbas'] # Evaluate
	names.sort()
	F1s = 0
	for i in names:
		scores = numpy.array(predictionSet[i][0])
		labels = numpy.array(predictionSet[i][1])
		scores = numpy.int64(scores > 0)
		F1 = f1_score(labels, scores)
		ACC = accuracy_score(labels, scores)
		if i != 'abbas':
			F1s += F1
			print("%s, ACC:%.2f, F1:%.2f"%(i, 100 * ACC, 100 * F1))
	print("Average F1:%.2f"%(100 * (F1s / 5)))	
 
def read_subtitles(subtitle_file):
    subs = pysrt.open(subtitle_file)
    sutitles = [(((sub.start.hours * 60 + sub.start.minutes) * 60 + sub.start.seconds) * 1000 + sub.start.milliseconds, (((sub.end.hours * 60 + sub.end.minutes) * 60 + sub.end.seconds) * 1000 + sub.end.milliseconds), sub.text) for sub in subs]
    return sutitles

def milliseconds_to_frame(milliseconds, fps=25):
	frame_number = int(milliseconds * fps / 1000)
	return frame_number

def ms_to_subtitle_time(ms):
    hours = ms // 3600000
    minutes = (ms % 3600000) // 60000
    seconds = (ms % 60000) // 1000
    remaining_ms = ms % 1000
    
    # Format the time string
    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d},{remaining_ms:03d}"
    
    return time_str

def extract_face_from_image(input: str, box, output: str) -> dict:
	image = cv2.imread(input)
	x1, y1 = box['x_min'], box['y_min']
	x2, y2 = box['x_max'], box['y_max']
	face_image = image[y1:y2, x1:x2]
    
	if (face_image.shape[0] > 0 and face_image.shape[1] > 0):   # TODO investigate why face_image is empty sometimes
		cv2.imwrite(output, face_image)
    
def filter_duplicate_frames(data):
    entries_dict = defaultdict(dict)

    # Iterate through the printed_entries list
    for entry in data:
        # Get the key for the dictionary
        key = (entry['time_start_srt'], entry['track'])
        
        # Check if the key exists in the dictionary
        if key in entries_dict:
            # If it exists, compare the scores and keep the entry with the highest score
            # if entry['score'] > entries_dict[key]['score'] and detect_face(entry['image_path'], entry['box']):
            if entry['score'] > entries_dict[key]['score']:
                entries_dict[key] = entry
        else:
            # If the key doesn't exist, add the entry to the dictionary
            entries_dict[key] = entry

    # Convert the dictionary values to a list
    filtered_entries = list(entries_dict.values())
    
    with open(args['talknetProcessedJson'], 'w') as f:
        json.dump(filtered_entries, f)
    
    
    for entry in filtered_entries:
        output_path = os.path.join(args['pyframesFacePath'], f"{entry['time_start_ms']}.jpg")
        extract_face_from_image(entry['image_path'], entry['box'], output_path)

# Main function
def main(videoPath, subtitlesPath, savePath):
	# This preprocesstion is modified based on this [repository](https://github.com/joonson/syncnet_python).
	# ```
	# .
	# ├── pyavi
	# │   ├── audio.wav (Audio from input video)
	# │   ├── video.avi (Copy of the input video)
	# │   ├── video_only.avi (Output video without audio)
	# │   └── video_out.avi  (Output video with audio)
	# ├── pycrop (The detected face videos and audios)
	# │   ├── 000000.avi
	# │   ├── 000000.wav
	# │   ├── 000001.avi
	# │   ├── 000001.wav
	# │   └── ...
	# ├── pyframes (All the video frames in this video)
	# │   ├── 000001.jpg
	# │   ├── 000002.jpg
	# │   └── ...	
	# └── pywork
	#     ├── faces.pckl (face detection result)
	#     ├── scene.pckl (scene detection result)
	#     ├── scores.pckl (ASD result)
	#     └── tracks.pckl (face tracking result)
	# ```
 
	# Initialization 
	args['pyaviPath'] = os.path.join(savePath, 'pyavi')
	args['pyframesPath'] = os.path.join(savePath, 'pyframes')
	args['pyframesFacePath'] = os.path.join(savePath, 'pyframes_face')
	args['pyworkPath'] = os.path.join(savePath, 'pywork')
	args['pycropPath'] = os.path.join(savePath, 'pycrop')
	args['talknetProcessedJson'] = os.path.join(savePath, 'processed.json')
	args['pretrainModel'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pretrain_TalkSet.model')
	args['nDataLoaderThread'] = 10
	args['facedetScale'] = 0.25
	args['minTrack'] = 10
	args['numFailedDet'] = 10
	args['minFaceSize'] = 1
	args['cropScale'] = 0.40
	args['start'] = 0
	args['duration'] = 0
	args['evalCol'] = True
 
	# # Download the pretrained model
	# Link = "1AbN9fCf9IexMxEKXLQY2KYBlb-IhSEea"
	# cmd = "gdown --id %s -O %s"%(Link, args['pretrainModel'])
	# subprocess.call(cmd, shell=True, stdout=None)
 
	os.makedirs(args['pyaviPath'], exist_ok = True) # The path for the input video, input audio, output video
	os.makedirs(args['pyframesPath'], exist_ok = True) # Save all the video frames
	os.makedirs(args['pyframesFacePath'], exist_ok = True) # Save all the video frames
	os.makedirs(args['pyworkPath'], exist_ok = True) # Save the results in this process by the pckl method
	os.makedirs(args['pycropPath'], exist_ok = True) # Save the detected face clips (audio+video) in this process

	# Extract video
	args['videoFilePath'] = os.path.join(args['pyaviPath'], 'video.avi')
	# If duration did not set, extract the whole video, otherwise extract the video from 'args['start']' to 'args['start'] + args['duration']'
	command = ("ffmpeg -y -i %s -qscale:v 2 -threads %d -async 1 -r 25 %s -loglevel panic" % \
			(videoPath, args['nDataLoaderThread'], args['videoFilePath']))
	
	subprocess.call(command, shell=True, stdout=None)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Extract the video and save in %s \r\n" %(args['videoFilePath']))
	
	# Extract audio
	args['audioFilePath'] = os.path.join(args['pyaviPath'], 'audio.wav')
	command = ("ffmpeg -y -i %s -qscale:a 0 -ac 1 -vn -threads %d -ar 16000 %s -loglevel panic" % \
		(args['videoFilePath'], args['nDataLoaderThread'], args['audioFilePath']))
	subprocess.call(command, shell=True, stdout=None)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Extract the audio and save in %s \r\n" %(args['audioFilePath']))

	# Extract the video frames
	command = ("ffmpeg -y -i %s -qscale:v 2 -threads %d -f image2 %s -loglevel panic" % \
		(args['videoFilePath'], args['nDataLoaderThread'], os.path.join(args['pyframesPath'], '%06d.jpg'))) 
	subprocess.call(command, shell=True, stdout=None)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Extract the frames and save in %s \r\n" %(args['pyframesPath']))

	# Scene detection for the video frames
	scene = scene_detect(args)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Scene detection and save in %s \r\n" %(args['pyworkPath']))	

	# Face detection for the video frames
	faces = inference_video(args)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Face detection and save in %s \r\n" %(args['pyworkPath']))

	# Face tracking
	allTracks, vidTracks = [], []
	for shot in scene:
		if shot[1].frame_num - shot[0].frame_num >= args['minTrack']: # Discard the shot frames less than minTrack frames
			allTracks.extend(track_shot(args, faces[shot[0].frame_num:shot[1].frame_num])) # 'frames' to present this tracks' timestep, 'bbox' presents the location of the faces
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Face track and detected %d tracks \r\n" %len(allTracks))

	# Face clips cropping
	for ii, track in tqdm.tqdm(enumerate(allTracks), total = len(allTracks)):
		vidTracks.append(crop_video(args, track, os.path.join(args['pycropPath'], '%05d'%ii)))
	savePath = os.path.join(args['pyworkPath'], 'tracks.pckl')
	with open(savePath, 'wb') as fil:
		pickle.dump(vidTracks, fil)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Face Crop and saved in %s tracks \r\n" %args['pycropPath'])
	fil = open(savePath, 'rb')
	vidTracks = pickle.load(fil)

	# Active Speaker Detection by TalkNet
	files = glob.glob("%s/*.avi"%args['pycropPath'])
	files.sort()
	scores = evaluate_network(files, args)
	savePath = os.path.join(args['pyworkPath'], 'scores.pckl')
	with open(savePath, 'wb') as fil:
		pickle.dump(scores, fil)
	sys.stderr.write(time.strftime("%Y-%m-%d %H:%M:%S") + " Scores extracted and saved in %s \r\n" %args['pyworkPath'])

	visualization(vidTracks, scores, args, subtitlesPath)

if __name__ == '__main__':
    main()
