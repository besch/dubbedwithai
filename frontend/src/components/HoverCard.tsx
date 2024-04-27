import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SubtitleHoverCardProps {
  start: string;
  end: string;
  text: string;
  children: React.ReactNode;
  position: {
    left: number;
    width: number;
  };
}

const SubtitleHoverCard: React.FC<SubtitleHoverCardProps> = ({
  start,
  end,
  text,
  children,
  position,
}) => {
  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger>{children}</HoverCardTrigger>
      <HoverCardContent className="relative bottom-full mb-2">
        <div
          className="p-4 bg-white rounded-md shadow-md text-xs"
          style={{ position: "absolute", top: 100, left: `${position.left}%` }}
        >
          <h3 className="font-bold mb-2">Subtitle</h3>
          <p>Start: {start}</p>
          <p>End: {end}</p>
          <p className="italic mt-2">{text}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SubtitleHoverCard;

// <SubtitleHoverCard
//   key={index}
//   start={subtitle.start}
//   end={subtitle.end}
//   text={subtitle.text}
//   position={{ left: startWidth, width: subtitleWidth }}
// >
//   <div
//     key={index}
//     onClick={() => setSubtitle(subtitle)}
//     className="absolute bg-blue-500 h-16 rounded-md mt-2 cursor-pointer"
//     style={{ left: `${startWidth}%`, width: `${subtitleWidth}%` }}
//   ></div>
// </SubtitleHoverCard>
