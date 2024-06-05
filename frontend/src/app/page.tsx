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
import ActorList from "@/components/ActorList";

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <div className="flex flex-row">
          <ShowVideo />
          <ActorList />
        </div>
        <Timeline />
        <div className="flex flex-row">
          <SubtitleCard />
          <VoiceGenerator />
        </div>
      </Provider>
    </QueryClientProvider>
  );
}
