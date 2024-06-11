import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MarkerState = {
  markerStartPosition: number | null;
  markerEndPosition: number | null;
  markerStartPositionMs: number | null;
};

const initialState: MarkerState = {
  markerStartPosition: null,
  markerEndPosition: null,
  markerStartPositionMs: null,
};

export const markerSlice = createSlice({
  name: "marker",
  initialState,
  reducers: {
    setMarkerStartPosition: (state, action: PayloadAction<number | null>) => {
      state.markerStartPosition = action.payload;
    },
    setMarkerEndPosition: (state, action: PayloadAction<number | null>) => {
      state.markerEndPosition = action.payload;
    },
    setMarkerStartPositionMs: (state, action: PayloadAction<number | null>) => {
      state.markerStartPositionMs = action.payload;
    },
  },
});

export const {
  setMarkerStartPosition,
  setMarkerEndPosition,
  setMarkerStartPositionMs,
} = markerSlice.actions;
