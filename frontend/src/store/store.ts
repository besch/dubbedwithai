// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { videoSlice } from "./slices/video";
import { subtitleSlice } from "./slices/subtitle";
import { markerSlice } from "./slices/marker";

const store = configureStore({
  reducer: {
    video: videoSlice.reducer,
    subtitle: subtitleSlice.reducer,
    marker: markerSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
