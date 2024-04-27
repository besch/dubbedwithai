"use client";

import { Provider } from "react-redux";
import store from "@/store/store";
import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import VoiceGenerator from "@/components/VoiceGenerator";
import Timeline from "@/components/Timeline";
import SubtitleCard from "@/components/SubtitleCard";

export default function Home() {
  return (
    <Provider store={store}>
      <Timeline />
      <div className="flex flex-row">
        <SubtitleCard />
        <VoiceGenerator />
      </div>
    </Provider>
  );
}

// <main className="flex min-h-screen flex-col items-center justify-center bg-gray-700">
// <VideoPlayer />
// <FileUpload />
// <VoiceGenerator />
// </main>
