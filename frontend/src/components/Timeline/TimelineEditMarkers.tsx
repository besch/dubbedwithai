import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TimelineMarker from "@/components/Timeline/TimelineMarker";
import TimelineHighlight from "@/components/Timeline/TimelineHighlight";

const TimelineEditMarkers: React.FC<{
  currentMarkerPosition: number | null;
  videoMarkerPosition: number | null;
}> = ({ currentMarkerPosition, videoMarkerPosition }) => {
  const {
    markerStartPosition,
    markerEndPosition,
    markerStartPositionMs,
    markerEndPositionMs,
  } = useSelector((state: RootState) => state.timeline);

  return (
    <>
      {currentMarkerPosition !== null && (
        <TimelineMarker position={currentMarkerPosition} />
      )}
      {markerStartPosition !== null && (
        <TimelineMarker
          position={markerStartPosition}
          positionMs={markerStartPositionMs}
          color={"slate"}
        />
      )}
      {markerEndPosition !== null && (
        <TimelineMarker
          position={markerEndPosition}
          positionMs={markerEndPositionMs}
          color={"slate"}
        />
      )}
      {markerStartPosition !== null && markerEndPosition !== null && (
        <TimelineHighlight
          start={markerStartPosition}
          end={markerEndPosition}
        />
      )}
      {videoMarkerPosition !== null && (
        <TimelineMarker position={videoMarkerPosition} color={"blue"} />
      )}
    </>
  );
};

export default TimelineEditMarkers;
