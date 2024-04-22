"use client";

import { Provider } from "react-redux";
import store from "@/store/store";
import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";

export default function Home() {
  return (
    <Provider store={store}>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-700">
        <VideoPlayer />
        <FileUpload />
      </main>
    </Provider>
  );
}
