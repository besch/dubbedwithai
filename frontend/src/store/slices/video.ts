import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoState {
  videoBlob: Blob | null;
}

const initialState: VideoState = {
  videoBlob: null,
};

export const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setVideoBlob: (state, action: PayloadAction<Blob | null>) => {
      state.videoBlob = action.payload;
    },
  },
});

export const { setVideoBlob } = videoSlice.actions;
