const TimelineHighlight: React.FC<{ start: number; end: number }> = ({
  start,
  end,
}) => {
  return (
    <div
      className="absolute top-0 bottom-0 bg-green-200 opacity-50 pointer-events-none"
      style={{ left: `${start}%`, width: `${end - start}%` }}
    ></div>
  );
};

export default TimelineHighlight;
