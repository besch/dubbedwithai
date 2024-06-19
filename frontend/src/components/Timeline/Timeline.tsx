"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  getImageByActorName,
  setSelectedSubtitleIndexes,
  getSelectedSubtitles,
} from "@/store/slices/subtitle";
import {
  setMarkerStartPosition,
  setMarkerEndPosition,
  setMarkerStartPositionMs,
  setMarkerEndPositionMs,
} from "@/store/slices/marker";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TimelineSubtitleItem from "@/components/Timeline/TimelineSubtitleItem";
import TimelineInvervalLabels from "@/components/Timeline/TimelineInvervalLabels";
import TimelineControls from "@/components/Timeline/TimelineControls";
import TimelineMarker from "@/components/Timeline/TimelineMarker";
import TimelineEditMarkers from "@/components/Timeline/TimelineEditMarkers";
import TimelinePlayPause from "@/components/Timeline/TimelinePlayPause";

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const { markerStartPosition } = useSelector(
    (state: RootState) => state.marker
  );
  const { videoTime } = useSelector((state: RootState) => state.video);
  const { subtitles, selectedSubtitleIndexes } = useSelector(
    (state: RootState) => state.subtitle
  );
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitles = getSelectedSubtitles(subtitleState);
  const getActorImage = getImageByActorName(subtitleState);
  const [zoom, setZoom] = useState<number>(15);
  const [currentMarkerPosition, setCurrentMarkerPosition] = useState<
    number | null
  >(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  let totalDuration = 0;
  if (subtitles.length) {
    const lastSubtitleEndTime = subtitles[subtitles.length - 1].endMs;
    totalDuration = lastSubtitleEndTime;
  }
  const timelineWidth = `${100 + zoom * 500}%`;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.altKey) {
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
    const isSubtitleClick =
      e.target instanceof HTMLDivElement &&
      e.target.classList.contains("subtitle-item");

    if (!isSubtitleClick) {
      dispatch(setSelectedSubtitleIndexes([]));
    }

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const position = (mouseX / rect.width) * 100;
      const positionInMs = (position / 100) * totalDuration;

      if (e.shiftKey) {
        dispatch(setMarkerEndPosition(position));
        dispatch(setMarkerEndPositionMs(positionInMs));
        if (markerStartPosition !== null) {
          const markerStartPositionInMs =
            (markerStartPosition / 100) * totalDuration;
          const selectedIndexes = subtitles
            .filter(
              (subtitle) =>
                (subtitle.endMs >= markerStartPositionInMs &&
                  subtitle.startMs <= positionInMs) ||
                (subtitle.startMs <= markerStartPositionInMs &&
                  subtitle.endMs >= positionInMs)
            )
            .map((subtitle) => subtitle.index);

          dispatch(setSelectedSubtitleIndexes(selectedIndexes));
        }
      } else {
        dispatch(setMarkerStartPositionMs(positionInMs));
        dispatch(setMarkerStartPosition(position));
        dispatch(setMarkerEndPosition(null));
      }
    }
  };

  const handleSubtitleClick = (
    event: React.MouseEvent<HTMLDivElement>,
    subtitleIndex: number
  ) => {
    const isCtrlPressed = event.ctrlKey;

    if (isCtrlPressed) {
      if (selectedSubtitleIndexes.includes(subtitleIndex)) {
        if (selectedSubtitles.length === 1) return;
        dispatch(
          setSelectedSubtitleIndexes(
            selectedSubtitleIndexes.filter((i) => i !== subtitleIndex)
          )
        );
      } else {
        dispatch(
          setSelectedSubtitleIndexes([
            ...selectedSubtitleIndexes,
            subtitleIndex,
          ])
        );
      }
    } else {
      dispatch(setSelectedSubtitleIndexes([subtitleIndex]));
    }
  };

  useEffect(() => {
    if (videoTime !== null) {
      const position = (videoTime / totalDuration) * 100;
      dispatch(setMarkerStartPosition(position));
    }
  }, [videoTime]);

  return (
    <>
      <TimelineControls zoom={zoom} setZoom={setZoom} />
      <TimelinePlayPause />
      <div className="relative w-full h-50 overflow-x-auto overflow-y-hidden sticky bottom-0">
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
            {subtitles.map((subtitle) => {
              const startWidth = (subtitle.startMs / totalDuration) * 100;
              const subtitleWidth =
                ((subtitle.endMs - subtitle.startMs) / totalDuration) * 100;

              return (
                <TimelineSubtitleItem
                  key={subtitle.index}
                  selected={
                    selectedSubtitles?.some(
                      (s) => s.index === subtitle.index
                    ) ?? false
                  }
                  onClick={(e) => handleSubtitleClick(e, subtitle.index)}
                  startWidth={startWidth}
                  subtitleWidth={subtitleWidth}
                  image={getActorImage(subtitle.actorName)}
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
