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
    <Card className="w-[350px] m-10">
      <CardHeader>
        <CardTitle>Subtitle</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Start: {subtitle.start}</p>
        <p>End: {subtitle.end}</p>
        <p>Text: {subtitle.text}</p>
      </CardContent>
    </Card>
  );
};

export default SubtitleCard;
