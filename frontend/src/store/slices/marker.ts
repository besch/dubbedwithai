import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MarkerState = {
  markerStartPosition: number | null;
  markerEndPosition: number | null;
};

const initialState: MarkerState = {
  markerStartPosition: null,
  markerEndPosition: null,
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
  },
});

export const { setMarkerStartPosition, setMarkerEndPosition } =
  markerSlice.actions;
