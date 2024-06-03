import { formatTime } from "@/utils/timeline";

interface TimelineMarkersProps {
  totalDuration: number;
}

const TimelineMarkers: React.FC<TimelineMarkersProps> = ({ totalDuration }) => {
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-dashed border-gray-400"
          style={{ left: `${(i * 100) / 10}%` }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">
            {formatTime((totalDuration * i) / 10)}
          </div>
        </div>
      ))}
    </>
  );
};

export default TimelineMarkers;
