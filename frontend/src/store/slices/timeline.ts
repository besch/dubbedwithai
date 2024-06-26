import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TimelineState = {
  markerStartPosition: number | null;
  markerEndPosition: number | null;
  markerStartPositionMs: number | null;
  markerEndPositionMs: number | null;
  videoMarkerPosition: number | null;
  zoom: number;
  totalDuration: number;
};

const initialState: TimelineState = {
  markerStartPosition: null,
  markerEndPosition: null,
  markerStartPositionMs: null,
  markerEndPositionMs: null,
  videoMarkerPosition: null,
  zoom: 15,
  totalDuration: 0,
};

export const timelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    setMarkerStartPosition: (
      state,
      action: PayloadAction<{ position: number | null; totalDuration: number }>
    ) => {
      state.markerStartPosition = action.payload.position;
      state.markerStartPositionMs =
        action.payload.position !== null
          ? (action.payload.position / 100) * action.payload.totalDuration
          : null;
    },
    setMarkerEndPosition: (
      state,
      action: PayloadAction<{ position: number | null; totalDuration: number }>
    ) => {
      state.markerEndPosition = action.payload.position;
      state.markerEndPositionMs =
        action.payload.position !== null
          ? (action.payload.position / 100) * action.payload.totalDuration
          : null;
    },
    setVideoMarkerPosition: (
      state,
      action: PayloadAction<{ position: number | null; totalDuration: number }>
    ) => {
      state.videoMarkerPosition = action.payload.position;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setTotalDuration: (state, action: PayloadAction<number>) => {
      state.totalDuration = action.payload;
    },
  },
});

export const {
  setMarkerStartPosition,
  setMarkerEndPosition,
  setVideoMarkerPosition,
  setZoom,
  setTotalDuration,
} = timelineSlice.actions;
