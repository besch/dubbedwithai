import { formatTime } from "@/utils/timeline";

interface TimelineInvervalLabelsProps {
  totalDuration: number;
  zoom: number;
}

const TimelineInvervalLabels: React.FC<TimelineInvervalLabelsProps> = ({
  totalDuration,
  zoom,
}) => {
  return (
    <>
      {Array.from({ length: zoom * 11 }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-dashed border-gray-400"
          style={{ left: `${(i * 100) / (11 * zoom)}%` }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">
            {formatTime((totalDuration * i) / (11 * zoom))}
          </div>
        </div>
      ))}
    </>
  );
};

export default TimelineInvervalLabels;
