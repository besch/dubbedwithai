import { formatTime } from "@/utils/timeline";

const TimelineMarker: React.FC<{
  position: number;
  color?: string;
  positionMs?: number | null;
}> = ({ position, positionMs, color = "red" }) => {
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-180">
        <div
          className={`w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-solid border-transparent border-b-${color}-500`}
        ></div>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-[1px] rotate-180">
        <div
          className={`w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-solid border-transparent border-t-${color}-500`}
        ></div>
      </div>
      <div
        className={`absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-${color}-500`}
      ></div>
      {positionMs && (
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-xs font-bold">
          {formatTime(positionMs)}
        </div>
      )}
    </div>
  );
};

export default TimelineMarker;
