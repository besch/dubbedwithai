"use client";

import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

import store from "@/store/store";
import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import VoiceGenerator from "@/components/VoiceGenerator";
import Timeline from "@/components/Timeline/Timeline";
import SubtitleCard from "@/components/SubtitleCard";
import ShowVideo from "@/components/ShowVideo";

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ShowVideo />
        <Timeline />
        <div className="flex flex-row">
          <SubtitleCard />
          <VoiceGenerator />
        </div>
      </Provider>
    </QueryClientProvider>
  );
}

// <main className="flex min-h-screen flex-col items-center justify-center bg-gray-700">
// <VideoPlayer />
// <FileUpload />
// <VoiceGenerator />
// </main>
