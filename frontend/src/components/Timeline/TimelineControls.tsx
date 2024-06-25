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
import { setZoom } from "@/store/slices/timeline";

const TimelineControls: React.FC = () => {
  const dispatch = useDispatch();
  const { subtitles, selectedSubtitleIndexes } = useSelector(
    (state: RootState) => state.subtitle
  );
  const { zoom } = useSelector((state: RootState) => state.timeline);

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

  const handleZoomChange = (newZoom: number) => {
    dispatch(setZoom(newZoom));
  };

  return (
    <div className="my-2">
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
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-40 mr-2"
          />
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l mr-1"
            onClick={() => handleZoomChange(Math.min(40, zoom + 1))}
          >
            <FaSearchPlus className="w-4 h-4" />
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
            onClick={() => handleZoomChange(Math.max(0, zoom - 1))}
          >
            <FaSearchMinus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;
