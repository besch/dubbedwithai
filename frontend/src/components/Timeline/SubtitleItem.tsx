interface SubtitleItemProps {
  selected: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  startWidth: number;
  subtitleWidth: number;
  image: string | null;
}

const SubtitleItem: React.FC<SubtitleItemProps> = ({
  selected,
  onClick,
  startWidth,
  subtitleWidth,
  image,
}) => {
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`subtitle-item absolute h-16 rounded-md mt-2 cursor-pointer ${
          selected ? "bg-green-500" : "bg-blue-400"
        }`}
        style={{ left: `${startWidth}%`, width: `${subtitleWidth}%` }}
      ></div>
      {image && (
        <div
          className="absolute flex justify-center"
          style={{
            left: `${startWidth}%`,
            width: `${subtitleWidth}%`,
            top: "calc(100% + 4px)", // Position the image below the subtitle bar
          }}
        >
          <img
            src={`data:image/jpeg;base64,${image}`}
            className="w-10 h-10 top-10"
            alt="Face"
          />
        </div>
      )}
    </div>
  );
};

export default SubtitleItem;
