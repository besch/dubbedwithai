import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip } from "react-tooltip";
import { Button } from "@/components/ui/button";
import { getSelectedSubtitle } from "@/store/slices/subtitle";
import { setPlayVideoChunk, setIsPlaying } from "@/store/slices/video";
import {
  FaRegClone,
  FaVolumeUp,
  FaWhmcs,
  FaPlay,
  FaPause,
  FaSyncAlt,
} from "react-icons/fa";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";

const SubtitleCard = () => {
  const dispatch = useDispatch();
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const isPlaying = useSelector((state: RootState) => state.video.isPlaying);
  const selectedSubtitle = getSelectedSubtitle(subtitleState);

  const handlePlayPause = () => {
    if (selectedSubtitle) {
      const { start, end } = selectedSubtitle;
      const startTime = parseFloat(start);
      const endTime = parseFloat(end);
      dispatch(setPlayVideoChunk({ start: startTime, end: endTime }));
      dispatch(setIsPlaying(!isPlaying));
    }
  };

  return (
    <>
      {selectedSubtitle && (
        <Card className="w-[350px] m-5">
          <CardHeader>
            <CardTitle>
              <div className="flex flex-row justify-between">
                <div>Subtitle {selectedSubtitle.index}</div>
                <div>
                  {isPlaying ? (
                    <FaPause
                      onClick={handlePlayPause}
                      data-tooltip-id="dubbedWithAITooltip"
                      data-tooltip-content="Pause subtitle audio"
                    />
                  ) : (
                    <FaPlay
                      onClick={handlePlayPause}
                      data-tooltip-id="dubbedWithAITooltip"
                      data-tooltip-content="Play subtitle audio"
                    />
                  )}
                </div>
              </div>
            </CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSubtitle.image && (
              <img
                className="h-60px w-60px"
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
                    src={selectedSubtitle.audioFileUrl}
                    type="audio/wav"
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="flex flex-row items-center space-x-3 mt-5">
              <FaRegClone
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Clone Voice"
              />

              {selectedSubtitle.audioFileUrl ? (
                <FaVolumeUp
                  size={20}
                  className="cursor-pointer"
                  data-tooltip-id="dubbedWithAITooltip"
                  data-tooltip-content="Generate Voice"
                />
              ) : (
                <FaSyncAlt
                  size={20}
                  className="cursor-pointer"
                  data-tooltip-id="dubbedWithAITooltip"
                  data-tooltip-content="Regenerate Voice"
                />
              )}
              <FaWhmcs
                size={20}
                className="cursor-pointer"
                data-tooltip-id="dubbedWithAITooltip"
                data-tooltip-content="Voice Style"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SubtitleCard;
