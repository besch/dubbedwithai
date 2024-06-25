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
  setZoom,
  setTotalDuration,
} from "@/store/slices/timeline";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TimelineSubtitleItem from "@/components/Timeline/TimelineSubtitleItem";
import TimelineInvervalLabels from "@/components/Timeline/TimelineInvervalLabels";
import TimelineControls from "@/components/Timeline/TimelineControls";
import TimelineEditMarkers from "@/components/Timeline/TimelineEditMarkers";
import TimelinePlayPause from "@/components/Timeline/TimelinePlayPause";

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const { markerStartPosition, zoom, totalDuration } = useSelector(
    (state: RootState) => state.timeline
  );
  const { videoTime } = useSelector((state: RootState) => state.video);
  const { subtitles, selectedSubtitleIndexes } = useSelector(
    (state: RootState) => state.subtitle
  );
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const selectedSubtitles = getSelectedSubtitles(subtitleState);
  const getActorImage = getImageByActorName(subtitleState);
  const [currentMarkerPosition, setCurrentMarkerPosition] = useState<
    number | null
  >(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subtitles.length) {
      const lastSubtitleEndTime = subtitles[subtitles.length - 1].endMs;
      dispatch(setTotalDuration(lastSubtitleEndTime));
    }
  }, [subtitles, dispatch]);

  const timelineWidth = `${100 + zoom * 500}%`;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.altKey) {
      const container = containerRef.current;
      const timeline = timelineRef.current;
      if (container && timeline) {
        const newZoom = Math.max(0, zoom + (e.deltaY < 0 ? 1 : -1));
        dispatch(setZoom(newZoom));
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

      if (e.shiftKey) {
        dispatch(setMarkerEndPosition({ position, totalDuration }));
        if (markerStartPosition !== null) {
          const markerStartPositionInMs =
            (markerStartPosition / 100) * totalDuration;
          const positionInMs = (position / 100) * totalDuration;
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
        dispatch(setMarkerStartPosition({ position, totalDuration }));
        dispatch(setMarkerEndPosition({ position: null, totalDuration }));
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
      dispatch(setMarkerStartPosition({ position, totalDuration }));
    }
  }, [videoTime, totalDuration, dispatch]);

  return (
    <>
      <TimelineControls />
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
            <TimelineInvervalLabels />
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
          <TimelineEditMarkers currentMarkerPosition={currentMarkerPosition} />
        </div>
      </div>
    </>
  );
};

export default Timeline;
