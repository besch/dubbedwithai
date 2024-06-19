import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSelectedSubtitles,
  getImageByActorName,
} from "@/store/slices/subtitle";
import {
  FaRegClone,
  FaVolumeUp,
  FaWhmcs,
  FaPlay,
  FaPause,
  FaSyncAlt,
  FaUserTie,
  FaDivide,
} from "react-icons/fa";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import SelectActor from "./Actor/SelectActor";
import AddNewActor from "./Actor/AddNewActor";
import { useRef, useState } from "react";

const SubtitleCard = () => {
  const [audio, setAudio] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitles = getSelectedSubtitles(subtitleState);
  const getActorImage = getImageByActorName(subtitleState);

  const generateAudio = async () => {
    try {
      const response = await fetch("/api/elevenlabs/generate-voice", {
        method: "POST",
        body: JSON.stringify({ text: selectedSubtitles[0].text }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const audioBlob = await response.blob();
      setAudio(audioBlob);
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  };

  return (
    <>
      {selectedSubtitles.length > 0 && (
        <Card className="w-[350px] m-5">
          <CardHeader>
            <CardTitle>
              <div>
                Subtitle {selectedSubtitles.map((s) => s.index).join(", ")}
              </div>
            </CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex flex-row items-center">
              {selectedSubtitles[0].actorName ? (
                <>
                  <img
                    className="h-[60px] w-[60px]"
                    src={`data:image/png;base64,${getActorImage(
                      selectedSubtitles[0].actorName
                    )}`}
                    alt=""
                  />
                  <div className="ml-5 flex items-center">
                    {selectedSubtitles[0].actorName}
                  </div>
                </>
              ) : (
                <>
                  <FaUserTie size={60} />
                  <div className="ml-5 flex items-center">
                    Unidentified Actor
                  </div>
                </>
              )}
            </div>
            <p>
              <span className="font-bold">Start:</span>{" "}
              {selectedSubtitles[0].start}
            </p>
            <p>
              <span className="font-bold">End:</span> {selectedSubtitles[0].end}
            </p>
            <p>
              <span className="font-bold">Text:</span>{" "}
              {selectedSubtitles[0].text}
            </p>
            {selectedSubtitles[0].audioFileUrl && (
              <div className="mt-5">
                <FaPlay
                  className="cursor-pointer"
                  data-tooltip-id="dubbedWithAITooltip"
                  data-tooltip-content="Play audio"
                />
                <FaPause
                  className="cursor-pointer"
                  data-tooltip-id="dubbedWithAITooltip"
                  data-tooltip-content="Pause audio"
                />
                <audio controls>
                  <source
                    src={selectedSubtitles[0].audioFileUrl}
                    type="audio/wav"
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="flex flex-row items-center space-x-3 mt-5">
              <FaVolumeUp
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Generate Voice"
                onClick={generateAudio}
              />
              <FaRegClone
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Clone Voice"
              />
              <FaWhmcs
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Voice Style"
              />
              <FaDivide
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Remove Vocals"
              />
            </div>
            <SelectActor />
            <AddNewActor />
            {audio && (
              <audio ref={audioRef} controls>
                <source src={URL.createObjectURL(audio)} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubtitleCard;
