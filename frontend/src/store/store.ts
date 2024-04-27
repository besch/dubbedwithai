// store.ts
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { videoSlice } from "./slices/video";
import { subtitleSlice } from "./slices/subtitle";

export const { setVideoBlob } = videoSlice.actions;

const store = configureStore({
  reducer: {
    video: videoSlice.reducer,
    subtitle: subtitleSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
