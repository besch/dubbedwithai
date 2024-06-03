interface SubtitleItemProps {
  selected: boolean;
  onClick: () => void;
  startWidth: number;
  subtitleWidth: number;
  faceImage: string | null;
}

const SubtitleItem: React.FC<SubtitleItemProps> = ({
  selected,
  onClick,
  startWidth,
  subtitleWidth,
  faceImage,
}) => {
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`absolute h-16 rounded-md mt-2 cursor-pointer ${
          selected ? "bg-green-500" : "bg-blue-500"
        }`}
        style={{ left: `${startWidth}%`, width: `${subtitleWidth}%` }}
      ></div>
      {faceImage && (
        <div
          className="absolute flex justify-center"
          style={{
            left: `${startWidth}%`,
            width: `${subtitleWidth}%`,
            top: "calc(100% + 4px)", // Position the image below the subtitle bar
          }}
        >
          <img
            src={`data:image/jpeg;base64,${faceImage}`}
            className="w-10 h-10"
            alt="Face"
          />
        </div>
      )}
    </div>
  );
};

export default SubtitleItem;
