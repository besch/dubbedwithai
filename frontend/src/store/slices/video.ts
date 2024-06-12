import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoState {
  videoBlob: Blob | null;
  playVideoChunk: { start: number; end: number };
  isPlaying: boolean;
  isCanvasActive: boolean;
  canvasImage: string | null;
  videoTime: number | null;
}

const initialState: VideoState = {
  videoBlob: null,
  playVideoChunk: { start: 0, end: 0 },
  isPlaying: false,
  isCanvasActive: false,
  canvasImage: null,
  videoTime: null,
};

export const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setVideoBlob: (state, action: PayloadAction<Blob | null>) => {
      state.videoBlob = action.payload;
    },
    setPlayVideoChunk: (
      state,
      action: PayloadAction<{ start: number; end: number }>
    ) => {
      state.playVideoChunk = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setIsCanvasActive: (state, action: PayloadAction<boolean>) => {
      state.isCanvasActive = action.payload;
    },
    setCanvasImage: (state, action: PayloadAction<string | null>) => {
      state.canvasImage = action.payload;
    },
    setVideoTime: (state, action: PayloadAction<number>) => {
      state.videoTime = action.payload;
    },
  },
});

export const {
  setVideoBlob,
  setPlayVideoChunk,
  setIsPlaying,
  setIsCanvasActive,
  setCanvasImage,
  setVideoTime,
} = videoSlice.actions;
