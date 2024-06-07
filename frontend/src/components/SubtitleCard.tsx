import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSelectedSubtitle } from "@/store/slices/subtitle";
import {
  FaRegClone,
  FaVolumeUp,
  FaWhmcs,
  FaPlay,
  FaPause,
  FaSyncAlt,
} from "react-icons/fa";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const SubtitleCard = () => {
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitle = getSelectedSubtitle(subtitleState);

  return (
    <>
      {selectedSubtitle && (
        <Card className="w-[350px] m-10 mr-0">
          <CardHeader>
            <CardTitle>Subtitle</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSubtitle.image && (
              <img
                className="h-60px w-60px p-2"
                src={`data:image/png;base64,${selectedSubtitle.image}`}
                alt=""
              />
            )}
            <p>
              <span className="font-bold">Start:</span> {selectedSubtitle.start}
            </p>
            <p>
              <span className="font-bold">End:</span> {selectedSubtitle.end}
            </p>
            <p>
              <span className="font-bold">Text:</span> {selectedSubtitle.text}
            </p>
            {selectedSubtitle.audioFileUrl && (
              <div className="mt-5">
                <FaPlay /> Play audio
                <FaPause /> Pause audio
                <audio controls>
                  <source
                    src={selectedSubtitle.audioFileUrl}
                    type="audio/wav"
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="flex flex-col space-y-2 mt-5">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {}}
              >
                <FaRegClone />
                <span>Clone voice</span>
              </div>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {}}
              >
                {selectedSubtitle.audioFileUrl ? (
                  <>
                    <FaVolumeUp />
                    <span>Generate voice</span>
                  </>
                ) : (
                  <>
                    <FaSyncAlt />
                    <span>Regenerate voice</span>
                  </>
                )}
              </div>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {}}
              >
                <FaWhmcs />
                <span>Voice style</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubtitleCard;
