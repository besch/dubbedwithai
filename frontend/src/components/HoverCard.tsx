import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Subtitle {
  start: string;
  end: string;
  text: string;
  children: React.ReactNode;
}

const SubtitleHoverCard: React.FC<Subtitle> = ({
  start,
  end,
  text,
  children,
}) => {
  return (
    <HoverCard>
      <HoverCardTrigger>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className="relative bottom-full mb-2">
        <div className="p-4 bg-white rounded-md shadow-md text-xs">
          <h3 className="font-bold">Subtitle</h3>
          <p>Start: {start}</p>
          <p>End: {end}</p>
          <p>{text}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SubtitleHoverCard;
