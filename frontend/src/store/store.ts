// store.ts
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoState {
  videoBlob: Blob | null;
}

const initialState: VideoState = {
  videoBlob: null,
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setVideoBlob: (state, action: PayloadAction<Blob | null>) => {
      state.videoBlob = action.payload;
    },
  },
});

export const { setVideoBlob } = videoSlice.actions;

const store = configureStore({
  reducer: {
    video: videoSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
