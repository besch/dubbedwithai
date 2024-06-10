import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

export type SubtitleType = {
  index: number;
  start: string;
  end: string;
  startMs: number;
  endMs: number;
  text: string;
  audioFileUrl: string;
  image: string | null;
  actorName: string;
};

export type FaceDataType = {
  data: Array<{
    image_name: string;
    subtitle_time_ms: number;
    subtitle_time_str: string;
    image_path: string;
    group_image_name: string;
    group_image_path: string;
    group_image_encoded_ref: string;
  }>;
  encoded_images: { [key: string]: string };
};

export type SubtitleState = {
  selectedSubtitleIndexes: number[];
  subtitles: SubtitleType[];
  faceData: FaceDataType;
};

const initialState: SubtitleState = {
  selectedSubtitleIndexes: [],
  subtitles: [],
  faceData: {
    data: [],
    encoded_images: {},
  },
};

export const subtitleSlice = createSlice({
  name: "subtitle",
  initialState,
  reducers: {
    setSelectedSubtitleIndexes: (state, action: PayloadAction<number[]>) => {
      state.selectedSubtitleIndexes = action.payload;
    },
    setSubtitles: (state, action: PayloadAction<SubtitleType[]>) => {
      state.subtitles = action.payload;
    },
    setFaceData: (state, action: PayloadAction<FaceDataType>) => {
      state.faceData = action.payload;
    },
  },
});

export const { setSelectedSubtitleIndexes, setSubtitles, setFaceData } =
  subtitleSlice.actions;

export const getSelectedSubtitles = createSelector(
  (state: SubtitleState) => state.subtitles,
  (state: SubtitleState) => state.selectedSubtitleIndexes,
  (subtitles, selectedSubtitleIndexes) => {
    if (subtitles.length === 0 || selectedSubtitleIndexes.length === 0)
      return [];

    return selectedSubtitleIndexes.map((index) => subtitles[index]);
  }
);

export const getImageByActorName = createSelector(
  (state: SubtitleState) => state.faceData,
  (faceData) => (actorName: string) => faceData.encoded_images[actorName]
);
