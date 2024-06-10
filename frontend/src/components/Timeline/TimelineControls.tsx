import React from "react";
import {
  FaSearchPlus,
  FaSearchMinus,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedSubtitleIndexes } from "@/store/slices/subtitle";

interface TimelineControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoom,
  setZoom,
}) => {
  const dispatch = useDispatch();
  const { subtitles, selectedSubtitleIndexes } = useSelector(
    (state: RootState) => state.subtitle
  );
  const selectPrevSubtitle = () => {
    if (
      selectedSubtitleIndexes.length === 1 &&
      selectedSubtitleIndexes[0] > 0
    ) {
      dispatch(setSelectedSubtitleIndexes([selectedSubtitleIndexes[0] - 1]));
    }
  };

  const selectNextSubtitle = () => {
    if (
      selectedSubtitleIndexes.length === 1 &&
      selectedSubtitleIndexes[0] < subtitles.length - 1
    ) {
      dispatch(setSelectedSubtitleIndexes([selectedSubtitleIndexes[0] + 1]));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l mr-1"
          onClick={selectPrevSubtitle}
          disabled={selectedSubtitleIndexes[0] === 0}
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
          onClick={selectNextSubtitle}
          disabled={selectedSubtitleIndexes[0] === subtitles.length - 1}
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
