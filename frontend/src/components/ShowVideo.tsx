import { Suspense, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMarkerStartPosition } from "@/store/slices/marker";
import { setIsPlaying } from "@/store/slices/video";
import { convertToMilliseconds, formatTime } from "@/utils/timeline";
import { getSelectedSubtitle } from "@/store/slices/subtitle";

export default function ShowVideo() {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const { isPlaying, playVideoChunk } = useSelector(
    (state: RootState) => state.video
  );
  const selectedSubtitle = getSelectedSubtitle(subtitleState);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && selectedSubtitle) {
      const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime * 1000; // Convert seconds to milliseconds
        dispatch(setMarkerStartPosition(parseFloat(formatTime(currentTime))));

        if (currentTime >= convertToMilliseconds(selectedSubtitle.end)) {
          videoElement.pause();
          dispatch(setIsPlaying(false));
          videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };

      const handlePlayPause = () => {
        if (isPlaying) {
          videoElement.currentTime =
            convertToMilliseconds(selectedSubtitle.start) / 1000; // Convert milliseconds to seconds
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
          videoElement.currentTime = playVideoChunk.start / 1000; // Convert milliseconds to seconds
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
  }, [dispatch, selectedSubtitle, isPlaying, playVideoChunk]);

  return (
    <div className="m-5 w-2/3">
      <Suspense fallback={<p>Loading video...</p>}>
        <video ref={videoRef} src="/chlopaki_nie_placza.mp4" controls />
      </Suspense>
    </div>
  );
}
