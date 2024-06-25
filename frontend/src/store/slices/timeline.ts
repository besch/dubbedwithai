import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TimelineState = {
  markerStartPosition: number | null;
  markerEndPosition: number | null;
  markerStartPositionMs: number | null;
  markerEndPositionMs: number | null;
  zoom: number | null;
  timelineDuration: number | null;
};

const initialState: TimelineState = {
  markerStartPosition: null,
  markerEndPosition: null,
  markerStartPositionMs: null,
  markerEndPositionMs: null,
  zoom: null,
  timelineDuration: null,
};

export const timelineSlice = createSlice({
  name: "timeline",
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
    setMarkerEndPositionMs: (state, action: PayloadAction<number | null>) => {
      state.markerEndPositionMs = action.payload;
    },
    setZoom: (state, action: PayloadAction<number | null>) => {
      state.zoom = action.payload;
    },
    setTimelineDuration: (state, action: PayloadAction<number | null>) => {
      state.timelineDuration = action.payload;
    },
  },
});

export const {
  setMarkerStartPosition,
  setMarkerEndPosition,
  setMarkerStartPositionMs,
  setMarkerEndPositionMs,
  setZoom,
  setTimelineDuration,
} = timelineSlice.actions;
