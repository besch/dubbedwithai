"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaSpinner } from "react-icons/fa";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoObjectURL, setVideoObjectURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setVideoObjectURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    return () => {
      if (videoObjectURL) {
        URL.revokeObjectURL(videoObjectURL);
      }
    };
  }, [file]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropZoneHovered(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropZoneHovered(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setIsDropZoneHovered(false);
  };

  const handleCancelUpload = () => {
    setFile(null);
    setVideoObjectURL(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/convert-video", {
        method: "POST",
        body: formData,
      });

      if (videoRef.current) {
        const videoBlob = await response.blob();
        console.log(videoBlob);
        const videoUrl = URL.createObjectURL(videoBlob);
        videoRef.current.src = videoUrl;
      }
      setFile(null);
    } catch (error) {
      console.error("Error converting video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="m-10">
        <video
          ref={videoRef}
          autoPlay
          controls
          className="w-96 h-64 rounded-lg"
        />
      </div>

      <div
        className={`flex flex-col items-center justify-center w-96 h-64 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          isDropZoneHovered
            ? "border-blue-500 bg-blue-100"
            : "border-gray-300 bg-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className="flex flex-col items-center">
            <p className="text-gray-500 text-sm mb-2">
              Drag and drop a video file here, or click to select a file
            </p>
            <label
              htmlFor="file-upload"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center mt-10">
            <p className="text-gray-500 text-sm mb-2">File: {file.name}</p>
            <div className="flex items-center mt-10 gap-5">
              <button
                onClick={handleUpload}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Upload
              </button>
              <button
                onClick={handleCancelUpload}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {isUploading && (
          <div className="flex items-center mt-4">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <p className="text-gray-500 text-sm">
              Uploading and converting video...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
