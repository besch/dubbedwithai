"use client";

import React, { useState, useRef } from "react";

const Timeline = () => {
  const [zoom, setZoom] = useState(0);
  const timelineRef = useRef(null);

  const subtitles = [
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

  const handleWheel = (e) => {
    if (e.altKey) {
      e.preventDefault();
      const newZoom = Math.max(0, zoom + (e.deltaY < 0 ? 1 : -1));
      setZoom(newZoom);
    }
  };

  return (
    <div
      className="relative w-full h-24 overflow-x-auto"
      onWheel={handleWheel}
      ref={timelineRef}
    >
      <div
        className="h-24 bg-gray-200 rounded-md relative"
        style={{ width: timelineWidth }}
      >
        {subtitles.map((subtitle, index) => {
          const startTime = convertToMilliseconds(subtitle.start);
          const endTime = convertToMilliseconds(subtitle.end);
          const startWidth = (startTime / totalDuration) * 100;
          const subtitleWidth = ((endTime - startTime) / totalDuration) * 100;

          return (
            <div
              key={index}
              className="absolute bg-blue-500 h-24 rounded-md"
              style={{
                left: `${startWidth}%`,
                width: `${subtitleWidth}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const convertToMilliseconds = (timeString) => {
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

export default Timeline;
