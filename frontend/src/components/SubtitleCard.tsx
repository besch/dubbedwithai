import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const SubtitleCard = () => {
  const subtitle = useSelector((state: RootState) => state.subtitle);
  return (
    <Card className="w-[350px] m-10 mr-0">
      <CardHeader>
        <CardTitle>Subtitle</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          <span className="font-bold">Start:</span> {subtitle.start}
        </p>
        <p>
          <span className="font-bold">End:</span> {subtitle.end}
        </p>
        <p>
          <span className="font-bold">Text:</span> {subtitle.text}
        </p>
        {subtitle.audioFileUrl && (
          <div className="mt-5">
            <audio controls>
              <source src={subtitle.audioFileUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubtitleCard;
