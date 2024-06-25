import { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setVideoTime } from "@/store/slices/video";
import { setTotalDuration } from "@/store/slices/timeline";
import ActorImageCapture from "./Actor/ActorImageCapture";

const ShowVideo = () => {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isPlaying, playVideoChunk, isCanvasActive } = useSelector(
    (state: RootState) => state.video
  );
  const { markerStartPositionMs, totalDuration } = useSelector(
    (state: RootState) => state.timeline
  );

  useEffect(() => {
    const videoElement = videoRef.current;
    const handleTimeUpdate = () => {
      const currentTime = videoElement!.currentTime * 1000;
      dispatch(setVideoTime(currentTime));
    };

    if (videoElement) {
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
      dispatch(setTotalDuration(videoElement.duration * 1000));
      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [playVideoChunk, dispatch]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && markerStartPositionMs !== null) {
      videoElement.currentTime = markerStartPositionMs / 1000;
    }
  }, [markerStartPositionMs]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement)
      if (isPlaying) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
  }, [isPlaying]);

  return (
    <div className="m-5 w-2/3">
      <video ref={videoRef} src="/chlopaki_nie_placza.mp4" controls />
      {isCanvasActive && <ActorImageCapture videoRef={videoRef} />}
    </div>
  );
};

export default ShowVideo;
