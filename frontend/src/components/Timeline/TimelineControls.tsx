import React from "react";
import {
  FaSearchPlus,
  FaSearchMinus,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSubtitleIndex, getSelectedSubtitle } from "@/store/slices/subtitle";

interface TimelineControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  currentIndex: number;
  subtitlesLength: number;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoom,
  setZoom,
  currentIndex,
  subtitlesLength,
}) => {
  const dispatch = useDispatch();
  const { subtitles } = useSelector((state: RootState) => state.subtitle);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitle = getSelectedSubtitle(subtitleState);
  const selectPrevSubtitle = () => {
    if (
      selectedSubtitle &&
      selectedSubtitle.index &&
      parseInt(selectedSubtitle.index) > 0
    ) {
      const index = parseInt(selectedSubtitle?.index);
      const prevIndexString = (index - 1).toString();
      dispatch(setSubtitleIndex(prevIndexString));
    }
  };

  const selectNextSubtitle = () => {
    if (
      selectedSubtitle &&
      selectedSubtitle.index &&
      parseInt(selectedSubtitle.index) < subtitles.length - 1
    ) {
      const index = parseInt(selectedSubtitle?.index);
      const prevIndexString = (index + 1).toString();
      dispatch(setSubtitleIndex(prevIndexString));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l mr-1"
          onClick={selectPrevSubtitle}
          disabled={currentIndex === 0}
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
          onClick={selectNextSubtitle}
          disabled={currentIndex === subtitlesLength - 1}
        >
          <FaArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-end items-center">
        <div>
          <span className="ml-2 pr-5 text-white">Current Zoom: {zoom}</span>
          <input
            type="range"
            min="0"
            max="40"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-40 mr-2"
          />
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l mr-1"
            onClick={() => setZoom(Math.min(10, zoom + 1))}
          >
            <FaSearchPlus className="w-4 h-4" />
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
            onClick={() => setZoom(Math.max(0, zoom - 1))}
          >
            <FaSearchMinus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;
