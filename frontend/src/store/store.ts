// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { videoSlice } from "./slices/video";
import { subtitleSlice } from "./slices/subtitle";
import { timelineSlice } from "./slices/timeline";

const store = configureStore({
  reducer: {
    video: videoSlice.reducer,
    subtitle: subtitleSlice.reducer,
    timeline: timelineSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
