"use client";
import React, { useState, useRef } from "react";
import { setSubtitleIndex } from "@/store/slices/subtitle";
import {
  setMarkerStartPosition,
  setMarkerEndPosition,
} from "@/store/slices/marker";
import { getSelectedSubtitle } from "@/store/slices/subtitle";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { convertToMilliseconds } from "@/utils/timeline";
import SubtitleItem from "@/components/Timeline/SubtitleItem";
import TimelineInvervalLabels from "@/components/Timeline/TimelineInvervalLabels";
import TimelineControls from "@/components/Timeline/TimelineControls";
import TimelineMarker from "@/components/Timeline/TimelineMarker";
import TimelineEditMarkers from "@/components/Timeline/TimelineEditMarkers";

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const { subtitles } = useSelector((state: RootState) => state.subtitle);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitle = getSelectedSubtitle(subtitleState);
  const [zoom, setZoom] = useState<number>(15);
  const [currentMarkerPosition, setCurrentMarkerPosition] = useState<
    number | null
  >(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  let totalDuration = 0;
  if (subtitles.length) {
    const lastSubtitleEndTime = subtitles[subtitles.length - 1].end;
    totalDuration = convertToMilliseconds(lastSubtitleEndTime);
  }
  const timelineWidth = `${100 + zoom * 500}%`;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.altKey) {
      e.preventDefault();
      const container = containerRef.current;
      const timeline = timelineRef.current;
      if (container && timeline) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const newZoom = Math.max(0, zoom + (e.deltaY < 0 ? 1 : -1));
        setZoom(newZoom);
      }
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const position = (mouseX / rect.width) * 100;
      setCurrentMarkerPosition(position);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const position = (mouseX / rect.width) * 100;

      if (e.shiftKey) {
        dispatch(setMarkerEndPosition(position));
      } else {
        dispatch(setMarkerStartPosition(position));
        dispatch(setMarkerEndPosition(null));
      }
    }
  };

  return (
    <>
      <TimelineControls
        zoom={zoom}
        setZoom={setZoom}
        currentIndex={currentIndex}
        subtitlesLength={subtitles.length}
      />
      <div className="relative w-full h-60 overflow-x-auto overflow-y-hidden p-4 sticky bottom-0">
        <div
          className="h-52 bg-gray-200 rounded-md relative"
          style={{ width: timelineWidth }}
          onWheel={handleWheel}
          onMouseMove={handleTimelineMouseMove}
          onClick={(e) => handleTimelineClick(e)}
          ref={containerRef}
        >
          <div ref={timelineRef}>
            <TimelineInvervalLabels totalDuration={totalDuration} zoom={zoom} />
            {subtitles.map((subtitle, index) => {
              const startTime = convertToMilliseconds(subtitle.start);
              const endTime = convertToMilliseconds(subtitle.end);
              const startWidth = (startTime / totalDuration) * 100;
              const subtitleWidth =
                ((endTime - startTime) / totalDuration) * 100;

              return (
                <SubtitleItem
                  key={index}
                  selected={
                    !!selectedSubtitle &&
                    selectedSubtitle.start === subtitle.start
                  }
                  onClick={() => {
                    setCurrentIndex(index);
                    dispatch(setSubtitleIndex(subtitle.index));
                  }}
                  startWidth={startWidth}
                  subtitleWidth={subtitleWidth}
                  image={subtitle.image}
                />
              );
            })}
          </div>
          {currentMarkerPosition !== null && (
            <TimelineMarker position={currentMarkerPosition} />
          )}
          <TimelineEditMarkers />
        </div>
      </div>
    </>
  );
};

export default Timeline;
