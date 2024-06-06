import { Suspense, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setMarkerStartPosition } from "@/store/slices/marker";
import { convertToMilliseconds, formatTime } from "@/utils/timeline";

export default function ShowVideo() {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const currentSubtitleStartTime = useSelector(
    (state: RootState) => state.subtitle.subtitle.start
  );

  useEffect(() => {
    if (videoRef.current && currentSubtitleStartTime) {
      const startTime = convertToMilliseconds(currentSubtitleStartTime);
      videoRef.current.currentTime = startTime / 1000; // Convert milliseconds to seconds
    }
  }, [currentSubtitleStartTime]);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime * 1000; // Convert seconds to milliseconds
      console.log(currentTime);
      dispatch(setMarkerStartPosition(formatTime(currentTime)));
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
