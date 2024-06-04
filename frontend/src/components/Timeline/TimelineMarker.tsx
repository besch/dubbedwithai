const TimelineMarker: React.FC<{ position: number }> = ({ position }) => {
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-180">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-solid border-transparent border-b-red-500"></div>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-[1px] rotate-180">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-solid border-transparent border-t-red-500"></div>
      </div>
      <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-red-500"></div>
    </div>
  );
};

export default TimelineMarker;
