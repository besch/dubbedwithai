import { Suspense, useRef, useEffect, MutableRefObject } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMarkerStartPosition } from "@/store/slices/marker";
import { convertToMilliseconds, formatTime } from "@/utils/timeline";
import { getSelectedSubtitle } from "@/store/slices/subtitle";

export default function ShowVideo() {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const currentSubtitleStartTime = getSelectedSubtitle(subtitleState)?.start;

  useEffect(() => {
    if (videoRef.current && currentSubtitleStartTime) {
      const startTime = convertToMilliseconds(currentSubtitleStartTime);
      videoRef.current.currentTime = startTime / 1000; // Convert milliseconds to seconds
    }
  }, [currentSubtitleStartTime]);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      if (videoElement) {
        const currentTime = videoElement.currentTime * 1000; // Convert seconds to milliseconds
        console.log(currentTime);
        dispatch(setMarkerStartPosition(parseFloat(formatTime(currentTime))));
      }
    };

    if (videoElement) {
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [dispatch]);

  return (
    <div className="m-5 w-2/3">
      <Suspense fallback={<p>Loading video...</p>}>
        <video ref={videoRef} src="/chlopaki_nie_placza.mp4" controls />
      </Suspense>
    </div>
  );
}
