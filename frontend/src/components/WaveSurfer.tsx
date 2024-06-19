import { useState, useRef } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { FaPlay, FaPause, FaSyncAlt } from "react-icons/fa";
import { getSelectedSubtitles } from "@/store/slices/subtitle";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const WaveSurfer = () => {
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitles = getSelectedSubtitles(subtitleState);
  const containerRef = useRef();

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: "./3a2f1027-f9b2-4a21-9cbb-bc83eb9fb05e.mp3",
    waveColor: "rgb(96 165 250)",
    progressColor: "rgb(34 197 94)",
    height: 30,
    normalize: true,
  });

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

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
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  };

  return (
    <div className="flex flex-row items-center">
      <div className="w-12">
        {isPlaying ? (
          <FaPause
            className="cursor-pointer"
            onClick={onPlayPause}
            size={25}
            color="rgb(96 165 250)"
          />
        ) : (
          <FaPlay
            className="cursor-pointer"
            onClick={onPlayPause}
            size={25}
            color="rgb(96 165 250)"
          />
        )}
      </div>
      <div className="w-full">
        <div ref={containerRef} />
      </div>
    </div>
  );
};

export default WaveSurfer;
