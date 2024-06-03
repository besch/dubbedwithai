"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import LazyLoad from "react-lazyload";
import { List } from "react-virtualized";
import { setSubtitle } from "@/store/slices/subtitle";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { convertToMilliseconds } from "@/utils/timeline";
import SubtitleItem from "@/components/Timeline/SubtitleItem";
import TimelineMarkers from "@/components/Timeline/TimelineMarkers";
import TimelineControls from "@/components/Timeline/TimelineControls";

export interface Subtitle {
  start: string;
  end: string;
  text: string;
}

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const selectedSubtitle = useSelector((state: RootState) => state.subtitle);
  const [zoom, setZoom] = useState<number>(15);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [faceData, setFaceData] = useState<any>(null);
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
        // const scrollWidth = timeline.scrollWidth - rect.width;
        // const newScrollLeft = scrollWidth * relativeMouseX;
        // timeline.scrollLeft = newScrollLeft;
        scrollToSubtitle(currentIndex);
      }
    }
  };

  const handlePrevSubtitle = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    dispatch(setSubtitle(subtitles[newIndex]));
    scrollToSubtitle(newIndex);
  };

  const handleNextSubtitle = () => {
    const newIndex = Math.min(subtitles.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    dispatch(setSubtitle(subtitles[newIndex]));
    scrollToSubtitle(newIndex);
  };

  // const scrollToSubtitle = (index: number) => {
  //   const timeline = timelineRef.current;
  //   if (timeline) {
  //     const subtitleElement = timeline.children[index];
  //     if (subtitleElement) {
  //       subtitleElement.scrollIntoView({
  //         behavior: "smooth",
  //         block: "center",
  //         inline: "center",
  //       });
  //     }
  //   }
  // };

  const scrollToSubtitle = (index: number) => {
    const timeline = timelineRef.current;
    const container = containerRef.current;
    if (timeline && container) {
      const subtitleElement = timeline.children[index];
      if (subtitleElement) {
        const subtitleRect = subtitleElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollLeft =
          subtitleElement.offsetLeft -
          containerRect.width / 2 +
          subtitleRect.width / 2;
        timeline.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
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

    fetchFaces();
    fetchSubtitles();
  }, []);

  const getFaceImage = useMemo(() => {
    return (subtitle: Subtitle) => {
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
  }, [faceData]);

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
      <div
        id="timeline"
        className="relative w-full h-40 overflow-x-auto overflow-y-hidden p-4"
      >
        <div
          className="h-32 bg-gray-200 rounded-md relative"
          style={{ width: timelineWidth }}
          onWheel={handleWheel}
          ref={containerRef}
        >
          <div ref={timelineRef}>
            <TimelineMarkers totalDuration={totalDuration} />
            {subtitles.map((subtitle, index) => {
              const startTime = convertToMilliseconds(subtitle.start);
              const endTime = convertToMilliseconds(subtitle.end);
              const startWidth = (startTime / totalDuration) * 100;
              const subtitleWidth =
                ((endTime - startTime) / totalDuration) * 100;
              const faceImage = getFaceImage(subtitle);

              return (
                <SubtitleItem
                  key={index}
                  subtitle={subtitle}
                  selected={selectedSubtitle.start === subtitle.start}
                  onClick={() => {
                    setCurrentIndex(index);
                    dispatch(setSubtitle(subtitle));
                    scrollToSubtitle(index);
                  }}
                  startWidth={startWidth}
                  subtitleWidth={subtitleWidth}
                  faceImage={faceImage}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Timeline;
