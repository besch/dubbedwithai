"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { setSubtitle } from "@/store/slices/subtitle";
import {
  setMarkerStartPosition,
  setMarkerEndPosition,
} from "@/store/slices/marker";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { convertToMilliseconds } from "@/utils/timeline";
import SubtitleItem from "@/components/Timeline/SubtitleItem";
import TimelineInvervalLabels from "@/components/Timeline/TimelineInvervalLabels";
import TimelineControls from "@/components/Timeline/TimelineControls";
import TimelineMarker from "@/components/Timeline/TimelineMarker";
import TimelineHighlight from "@/components/Timeline/TimelineHighlight";

export interface Subtitle {
  start: string;
  end: string;
  text: string;
}

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const selectedSubtitle = useSelector((state: RootState) => state.subtitle);
  const { markerStartPosition, markerEndPosition } = useSelector(
    (state: RootState) => state.marker
  );
  const [zoom, setZoom] = useState<number>(15);
  const [subtitlesWithFaces, setSubtitlesWithFaces] = useState<
    (Subtitle & { faceImage: string | null })[]
  >([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [faceData, setFaceData] = useState<any>(null);
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
        const relativeMouseX = mouseX / rect.width;
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

  const handlePrevSubtitle = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    dispatch(setSubtitle(subtitles[newIndex]));
  };

  const handleNextSubtitle = () => {
    const newIndex = Math.min(subtitles.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    dispatch(setSubtitle(subtitles[newIndex]));
  };

  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline) {
      timeline.scrollLeft = 0;
    }

    const fetchSubtitles = async () => {
      try {
        const response = await fetch("/api/get-subtitles");
        const { subtitles } = await response.json();
        setSubtitles(subtitles);
      } catch (error) {}
    };

    const fetchFaces = async () => {
      try {
        const response = await fetch("/api/get-faces");
        const data = await response.json();
        setFaceData(data.jsonData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchSubtitles();
    fetchFaces();
  }, []);

  const getFaceImage = useMemo(() => {
    return (subtitle: Subtitle, faceData: any) => {
      if (!faceData) return null;

      const foundFace = faceData.data.find((face) => {
        const subtitleStartMs = convertToMilliseconds(subtitle.start);
        const subtitleEndMs = convertToMilliseconds(subtitle.end);

        if (
          subtitleStartMs <= face.subtitle_time_ms &&
          face.subtitle_time_ms <= subtitleEndMs
        ) {
          return true;
        }

        return false;
      });

      if (foundFace) {
        return faceData.encoded_images[foundFace.group_image_encoded_ref];
      }

      return null;
    };
  }, []);

  useEffect(() => {
    if (faceData && subtitles.length > 0) {
      const updatedSubtitles = subtitles.map((subtitle) => ({
        ...subtitle,
        faceImage: getFaceImage(subtitle, faceData),
      }));
      setSubtitlesWithFaces(updatedSubtitles);
    }
  }, [faceData, subtitles, getFaceImage]);

  return (
    <>
      <TimelineControls
        zoom={zoom}
        setZoom={setZoom}
        handlePrevSubtitle={handlePrevSubtitle}
        handleNextSubtitle={handleNextSubtitle}
        currentIndex={currentIndex}
        subtitlesLength={subtitles.length}
      />
      <div className="relative w-full h-40 overflow-x-auto overflow-y-hidden p-4">
        <div
          className="h-32 bg-gray-200 rounded-md relative"
          style={{ width: timelineWidth }}
          onWheel={handleWheel}
          onMouseMove={handleTimelineMouseMove}
          onClick={(e) => handleTimelineClick(e)}
          ref={containerRef}
        >
          <div ref={timelineRef}>
            <TimelineInvervalLabels totalDuration={totalDuration} zoom={zoom} />
            {subtitlesWithFaces.map((subtitle, index) => {
              const startTime = convertToMilliseconds(subtitle.start);
              const endTime = convertToMilliseconds(subtitle.end);
              const startWidth = (startTime / totalDuration) * 100;
              const subtitleWidth =
                ((endTime - startTime) / totalDuration) * 100;

              return (
                <SubtitleItem
                  key={index}
                  subtitle={subtitle}
                  selected={selectedSubtitle.start === subtitle.start}
                  onClick={() => {
                    setCurrentIndex(index);
                    dispatch(setSubtitle(subtitle));
                  }}
                  startWidth={startWidth}
                  subtitleWidth={subtitleWidth}
                  faceImage={subtitle.faceImage}
                />
              );
            })}
          </div>
          {currentMarkerPosition !== null && (
            <TimelineMarker position={currentMarkerPosition} />
          )}
          {markerStartPosition !== null && (
            <TimelineMarker position={markerStartPosition} color={"slate"} />
          )}
          {markerEndPosition !== null && (
            <TimelineMarker position={markerEndPosition} color={"slate"} />
          )}
          {markerStartPosition !== null && markerEndPosition !== null && (
            <TimelineHighlight
              start={markerStartPosition}
              end={markerEndPosition}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Timeline;
