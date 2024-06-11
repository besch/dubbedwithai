import { Suspense, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMarkerStartPosition } from "@/store/slices/marker";
import { setIsPlaying } from "@/store/slices/video";
import { formatTime } from "@/utils/timeline";
import { getSelectedSubtitles } from "@/store/slices/subtitle";
import ActorImageCapture from "./Actor/ActorImageCapture";

export default function ShowVideo() {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const { isPlaying, playVideoChunk, isCanvasActive } = useSelector(
    (state: RootState) => state.video
  );
  const { markerStartPositionMs } = useSelector(
    (state: RootState) => state.marker
  );
  const selectedSubtitles = getSelectedSubtitles(subtitleState);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && selectedSubtitles.length === 1) {
      const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime * 1000; // Convert seconds to milliseconds
        dispatch(setMarkerStartPosition(parseFloat(formatTime(currentTime))));

        if (currentTime >= selectedSubtitles[0].endMs) {
          videoElement.pause();
          dispatch(setIsPlaying(false));
          videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };

      const handlePlayPause = () => {
        if (isPlaying) {
          videoElement.currentTime = selectedSubtitles[0].startMs / 1000;
          videoElement.play();
          videoElement.addEventListener("timeupdate", handleTimeUpdate);
        } else {
          videoElement.pause();
          dispatch(setIsPlaying(false));
          videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };

      const handlePlayVideoChunk = () => {
        if (playVideoChunk.start !== 0 && playVideoChunk.end !== 0) {
          videoElement.currentTime = playVideoChunk.start / 1000;
          videoElement.play();
          videoElement.addEventListener("timeupdate", handleTimeUpdate);
        }
      };

      handlePlayPause();
      handlePlayVideoChunk();

      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [
    dispatch,
    selectedSubtitles,
    markerStartPositionMs,
    isPlaying,
    playVideoChunk,
  ]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && markerStartPositionMs) {
      videoElement.currentTime = markerStartPositionMs / 1000;
    }
  }, [markerStartPositionMs]);

  return (
    <div className="m-5 w-2/3">
      <Suspense fallback={<p>Loading video...</p>}>
        <video ref={videoRef} src="/chlopaki_nie_placza.mp4" controls />
        {isCanvasActive && <ActorImageCapture videoRef={videoRef} />}
      </Suspense>
    </div>
  );
}
