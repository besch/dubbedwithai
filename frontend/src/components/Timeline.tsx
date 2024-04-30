"use client";
import React, { useState, useRef, useEffect } from "react";
import { setSubtitle } from "@/store/slices/subtitle";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Subtitle {
  start: string;
  end: string;
  text: string;
}

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const selectedSubtitle = useSelector((state: RootState) => state.subtitle);
  const [zoom, setZoom] = useState<number>(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  let totalDuration = 0;
  if (subtitles.length) {
    const lastSubtitleEndTime = subtitles[subtitles.length - 1].end;
    totalDuration = convertToMilliseconds(lastSubtitleEndTime);
  }
  const timelineWidth = `${100 + zoom * 25}%`;

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
        const scrollWidth = timeline.scrollWidth - rect.width;
        const newScrollLeft = scrollWidth * relativeMouseX;
        timeline.scrollLeft = newScrollLeft;
      }
    }
  };

  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline) {
      timeline.scrollLeft = 0;
    }

    const fetchSubtitles = async () => {
      console.log("Fetching subtitles");
      try {
        const response = await fetch("/api/get-subtitles");
        const { subtitles } = await response.json();
        setSubtitles(subtitles);
      } catch (error) {
        console.error("Error Fetching subtitles:", error);
      } finally {
      }
    };

    fetchSubtitles();
  }, []);

  return (
    <div
      className="relative w-full h-32 overflow-x-auto overflow-y-hidden p-4"
      onWheel={handleWheel}
      ref={containerRef}
    >
      <div
        className="h-24 bg-gray-200 rounded-md relative"
        style={{ width: timelineWidth }}
        ref={timelineRef}
      >
        {/* Render vertical dashed lines */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-dashed border-gray-400"
            style={{ left: `${(i * 100) / 10}%` }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">
              {formatTime((totalDuration * i) / 10)}
            </div>
          </div>
        ))}

        {subtitles.map((subtitle, index) => {
          const startTime = convertToMilliseconds(subtitle.start);
          const endTime = convertToMilliseconds(subtitle.end);
          const startWidth = (startTime / totalDuration) * 100;
          const subtitleWidth = ((endTime - startTime) / totalDuration) * 100;

          return (
            <div
              key={index}
              onClick={() => dispatch(setSubtitle(subtitle))}
              className={`absolute h-16 rounded-md mt-2 cursor-pointer ${
                selectedSubtitle.start === subtitle.start
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ left: `${startWidth}%`, width: `${subtitleWidth}%` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

const convertToMilliseconds = (timeString: string): number => {
  const [hours, minutes, secondsMillis] = timeString.split(":");
  const seconds = secondsMillis.split(",")[0];
  const millis = secondsMillis.split(",")[1];
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(millis, 10)
  );
};

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${padZero(minutes)}:${padZero(seconds)}`;
};

const padZero = (num: number): string => {
  return num.toString().padStart(2, "0");
};

export default Timeline;
