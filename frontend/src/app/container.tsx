"use client";

import { useMemo, useEffect, Suspense } from "react";
import { setFaceData, setSubtitles } from "@/store/slices/subtitle";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";

import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import VoiceGenerator from "@/components/VoiceGenerator";
import Timeline from "@/components/Timeline/Timeline";
import SubtitleCard from "@/components/SubtitleCard";
import ShowVideo from "@/components/ShowVideo";
import ActorList from "@/components/ActorList";
import { getFaceImage } from "@/utils/timeline";

const useLoadInitData = () => {
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

const FallbackUI = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold">Loading...</h2>
      <p className="text-gray-500">Please wait while we fetch the data.</p>
    </div>
  </div>
);

export default function Container() {
  const dispatch = useDispatch();
  const { subtitles, faceData } = useSelector(
    (state: RootState) => state.subtitle
  );

  useLoadInitData();

  const getFaceImageMemo = useMemo(() => getFaceImage, []);
  useEffect(() => {
    if (faceData && subtitles.length > 0) {
      console.log("here");
      const updatedSubtitles = subtitles.map((subtitle) => ({
        ...subtitle,
        image: getFaceImage(subtitle, faceData),
      }));
      dispatch(setSubtitles(updatedSubtitles));
    }
  }, [faceData, getFaceImageMemo, dispatch]);

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
