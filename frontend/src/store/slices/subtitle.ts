import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

export type SubtitleType = {
  index: number;
  start: string;
  end: string;
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
  selectedSubtitleIndex: number | null;
  subtitles: SubtitleType[];
  faceData: FaceDataType;
};

const initialState: SubtitleState = {
  selectedSubtitleIndex: null,
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
    setSelectedSubtitleIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedSubtitleIndex = action.payload;
    },
    setSubtitles: (state, action: PayloadAction<SubtitleType[]>) => {
      state.subtitles = action.payload;
    },
    setFaceData: (state, action: PayloadAction<FaceDataType>) => {
      state.faceData = action.payload;
    },
  },
});

export const { setSelectedSubtitleIndex, setSubtitles, setFaceData } =
  subtitleSlice.actions;

export const getSelectedSubtitle = createSelector(
  (state: SubtitleState) => state.subtitles,
  (state: SubtitleState) => state.selectedSubtitleIndex,
  (subtitles, selectedSubtitleIndex) => {
    if (subtitles.length === 0 || selectedSubtitleIndex === null) return null;
    return subtitles[selectedSubtitleIndex];
  }
);

export const getImageByActorName = createSelector(
  (state: SubtitleState) => state.faceData,
  (faceData) => (actorName: string) => faceData.encoded_images[actorName]
);
