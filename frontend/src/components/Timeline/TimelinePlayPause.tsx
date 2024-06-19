import React, { useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setIsPlaying } from "@/store/slices/video";

const TimelinePlayPause: React.FC = ({}) => {
  const dispatch = useDispatch();
  const isPlaying = useSelector((state: RootState) => state.video.isPlaying);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        dispatch(setIsPlaying(!isPlaying));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, isPlaying]);

  return (
    <div className="flex justify-center items-center h-[40px] bg-gray-200 cursor-pointer border-b-2 border-gray-300">
      {isPlaying ? (
        <FaPause onClick={() => dispatch(setIsPlaying(false))} />
      ) : (
        <FaPlay onClick={() => dispatch(setIsPlaying(true))} />
      )}
    </div>
  );
};

export default TimelinePlayPause;
