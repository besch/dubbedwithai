"use client";

import { useEffect } from "react";
import { setFaceData, setSubtitles } from "@/store/slices/subtitle";
import { useDispatch } from "react-redux";

import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import VoiceGenerator from "@/components/VoiceGenerator";
import Timeline from "@/components/Timeline/Timeline";
import SubtitleCard from "@/components/SubtitleCard";
import ShowVideo from "@/components/ShowVideo";
import ActorList from "@/components/ActorList";

const loadInitData = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        const response = await fetch("/api/get-subtitles");
        const { subtitles } = await response.json();
        dispatch(setSubtitles(subtitles));
      } catch (error) {}
    };

    const fetchFaces = async () => {
      try {
        const response = await fetch("/api/get-faces");
        const data = await response.json();
        dispatch(setFaceData(data.jsonData));
      } catch (error) {
        console.log(error);
      }
    };

    fetchSubtitles();
    fetchFaces();
  }, []);
};

export default function Container() {
  loadInitData();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <div className="flex flex-row">
            <ShowVideo />
            <ActorList />
            <SubtitleCard />
          </div>
        </div>
        <Timeline />
      </div>
    </>
  );
}
