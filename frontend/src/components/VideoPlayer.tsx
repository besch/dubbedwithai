"use client";

import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const VideoPlayer: React.FC = () => {
  const videoBlob = useSelector((state: RootState) => state.video.videoBlob);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob) {
      const videoUrl = URL.createObjectURL(videoBlob);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
      }
    }
  }, [videoBlob]);

  return (
    <div className="m-10">
      <video
        ref={videoRef}
        autoPlay
        controls
        className="w-96 h-64 rounded-lg"
      />
    </div>
  );
};

export default VideoPlayer;
