import { Suspense, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { convertToMilliseconds } from "@/utils/timeline";

export default function ShowVideo() {
  const videoRef = useRef(null);
  const currentSubtitleStartTime = useSelector(
    (state: RootState) => state.subtitle.start
  );

  useEffect(() => {
    if (videoRef.current && currentSubtitleStartTime) {
      const startTime = convertToMilliseconds(currentSubtitleStartTime);
      videoRef.current.currentTime = startTime / 1000; // Convert milliseconds to seconds
    }
  }, [currentSubtitleStartTime]);

  return (
    <div className="m-5 w-2/3">
      <Suspense fallback={<p>Loading video...</p>}>
        <video ref={videoRef} src="/chlopaki_nie_placza.mp4" controls />
      </Suspense>
    </div>
  );
}
