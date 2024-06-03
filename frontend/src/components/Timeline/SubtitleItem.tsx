import { Subtitle } from "@/components/Timeline/Timeline";

interface SubtitleItemProps {
  subtitle: Subtitle;
  selected: boolean;
  onClick: () => void;
  startWidth: number;
  subtitleWidth: number;
}

const SubtitleItem: React.FC<SubtitleItemProps> = ({
  subtitle,
  selected,
  onClick,
  startWidth,
  subtitleWidth,
}) => {
  return (
    <div
      onClick={onClick}
      className={`absolute h-16 rounded-md mt-2 cursor-pointer ${
        selected ? "bg-green-500" : "bg-blue-500"
      }`}
      style={{ left: `${startWidth}%`, width: `${subtitleWidth}%` }}
    ></div>
  );
};

export default SubtitleItem;
