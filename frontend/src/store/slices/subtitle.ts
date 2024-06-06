import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SubtitleType = {
  start: string;
  end: string;
  text: string;
  audioFileUrl: string;
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
  subtitle: SubtitleType;
  subtitles: SubtitleType[];
  faceData: FaceDataType;
};

const initialState: SubtitleState = {
  subtitle: {
    start: "",
    end: "",
    text: "",
    audioFileUrl: "",
  },
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
    setSubtitle: (state, action: PayloadAction<SubtitleType>) => {
      state.subtitle = action.payload;
    },
    setSubtitles: (state, action: PayloadAction<SubtitleType[]>) => {
      state.subtitles = action.payload;
    },
    setFaceData: (state, action: PayloadAction<FaceDataType>) => {
      state.faceData = action.payload;
    },
  },
});

export const { setSubtitle, setSubtitles, setFaceData } = subtitleSlice.actions;
