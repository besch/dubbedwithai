import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

export type SubtitleType = {
  index: string;
  start: string;
  end: string;
  text: string;
  audioFileUrl: string;
  image: string | null;
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
  subtitleIndex: string;
  subtitles: SubtitleType[];
  faceData: FaceDataType;
};

const initialState: SubtitleState = {
  subtitleIndex: "",
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
    setSubtitleIndex: (state, action: PayloadAction<string>) => {
      state.subtitleIndex = action.payload;
    },
    setSubtitles: (state, action: PayloadAction<SubtitleType[]>) => {
      state.subtitles = action.payload;
    },
    setFaceData: (state, action: PayloadAction<FaceDataType>) => {
      state.faceData = action.payload;
    },
  },
});

export const { setSubtitleIndex, setSubtitles, setFaceData } =
  subtitleSlice.actions;

export const getSelectedSubtitle = createSelector(
  (state: SubtitleState) => state.subtitles,
  (state: SubtitleState) => state.subtitleIndex,
  (subtitles, subtitleIndex) => {
    if (subtitles.length === 0 || !subtitleIndex) return null;
    return subtitles.find((subtitle) => subtitle.index === subtitleIndex);
  }
);
