import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoState {
  videoBlob: Blob | null;
  playVideoChunk: { start: number; end: number };
  isPlaying: boolean;
}

const initialState: VideoState = {
  videoBlob: null,
  playVideoChunk: { start: 0, end: 0 },
  isPlaying: false,
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
  },
});

export const { setVideoBlob, setPlayVideoChunk, setIsPlaying } =
  videoSlice.actions;
