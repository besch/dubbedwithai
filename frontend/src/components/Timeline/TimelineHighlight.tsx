const TimelineHighlight: React.FC<{ start: number; end: number }> = ({
  start,
  end,
}) => {
  const startPercentage = Math.min(start, end);
  const endPercentage = Math.max(start, end);
  const width = endPercentage - startPercentage;

  return (
    <div
      className="absolute top-0 bottom-0 bg-green-200 opacity-50 pointer-events-none"
      style={{ left: `${startPercentage}%`, width: `${width}%` }}
    ></div>
  );
};

export default TimelineHighlight;
