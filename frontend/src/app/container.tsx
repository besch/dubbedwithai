"use client";

import { useEffect, Suspense } from "react";
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

    const promises = [fetchSubtitles(), fetchFaces()];
    Promise.all(promises).catch((error) => console.error(error));
  }, []);
};

const FallbackUI = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold">Loading...</h2>
      <p className="text-gray-500">Please wait while we fetch the data.</p>
    </div>
  </div>
);

export default function Container() {
  loadInitData();

  return (
    <Suspense fallback={<FallbackUI />}>
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
    </Suspense>
  );
}
