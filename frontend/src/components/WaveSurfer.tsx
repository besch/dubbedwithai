import { useState, useRef } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { FaPlay, FaPause } from "react-icons/fa";

const WaveSurfer = () => {
  const containerRef = useRef();

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: "./3a2f1027-f9b2-4a21-9cbb-bc83eb9fb05e.mp3",
    waveColor: "#ff4e00",
    progressColor: "#dd5e98",
    height: 50,
    normalize: true,
  });

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

  return (
    <div className="flex flex-row items-center">
      <div className="w-12">
        {isPlaying ? (
          <FaPause
            className="cursor-pointer"
            onClick={onPlayPause}
            size={25}
            color="dd5e98"
          />
        ) : (
          <FaPlay
            className="cursor-pointer"
            onClick={onPlayPause}
            size={25}
            color="dd5e98"
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
