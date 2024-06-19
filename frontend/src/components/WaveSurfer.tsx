import { useState, useRef } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { FaPlay, FaPause } from "react-icons/fa";

const WaveSurfer = () => {
  const containerRef = useRef();

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: "./3a2f1027-f9b2-4a21-9cbb-bc83eb9fb05e.mp3",
    waveColor: "purple",
    height: 50,
  });

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

  return (
    <div className="">
      <div ref={containerRef} />

      {isPlaying ? (
        <FaPause className="cursor-pointer" onClick={onPlayPause} size={30} />
      ) : (
        <FaPlay className="cursor-pointer" onClick={onPlayPause} size={30} />
      )}
    </div>
  );
};

export default WaveSurfer;
