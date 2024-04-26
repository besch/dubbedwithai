"use client";
import React, { useState, useRef, useEffect } from "react";

interface Subtitle {
  start: string;
  end: string;
  text: string;
}

const Timeline: React.FC = () => {
  const [zoom, setZoom] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const subtitles: Subtitle[] = [
    { start: "00:00:49,162", end: "00:00:50,959", text: "CITY OF GOD" },
    {
      start: "00:01:51,991",
      end: "00:01:57,759",
      text: "Fuck, the chicken's got away! Go after that chicken, man!",
    },
    {
      start: "00:02:37,604",
      end: "00:02:41,472",
      text: "Get that chicken, bro!",
    },
    {
      start: "00:02:43,743",
      end: "00:02:46,769",
      text: "Motherfucker! I told you to grab that chicken!",
    },
  ];

  const totalDuration = 180000; // 3 minutes in milliseconds
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
  }, []);

  return (
    <div
      className="relative w-full h-32 overflow-x-auto overflow-y-hidden"
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
              className="absolute bg-blue-500 h-16 rounded-md mt-2"
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
