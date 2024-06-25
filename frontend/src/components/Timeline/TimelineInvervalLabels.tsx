import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { formatTime } from "@/utils/timeline";

const TimelineInvervalLabels: React.FC = () => {
  const { zoom, totalDuration } = useSelector(
    (state: RootState) => state.timeline
  );

  const baseInterval = zoom <= 2 ? 300 * 1000 : 30 * 1000;
  const numLabels = Math.ceil(totalDuration / baseInterval);

  return (
    <>
      {Array.from({ length: numLabels }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-dashed border-gray-400"
          style={{ left: `${(i * 100) / numLabels}%` }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">
            {formatTime(i * baseInterval)}
          </div>
        </div>
      ))}
    </>
  );
};

export default TimelineInvervalLabels;
