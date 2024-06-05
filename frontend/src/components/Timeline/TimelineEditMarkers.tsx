import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TimelineMarker from "@/components/Timeline/TimelineMarker";
import TimelineHighlight from "@/components/Timeline/TimelineHighlight";

const TimelineEditMarkers: React.FC = () => {
  const { markerStartPosition, markerEndPosition } = useSelector(
    (state: RootState) => state.marker
  );

  return (
    <>
      {markerStartPosition !== null && (
        <TimelineMarker position={markerStartPosition} color={"slate"} />
      )}
      {markerEndPosition !== null && (
        <TimelineMarker position={markerEndPosition} color={"slate"} />
      )}
      {markerStartPosition !== null && markerEndPosition !== null && (
        <TimelineHighlight
          start={markerStartPosition}
          end={markerEndPosition}
        />
      )}
    </>
  );
};

export default TimelineEditMarkers;
