import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SubtitleState {
  start: string;
  end: string;
  text: string;
  audioFileUrl: string;
}

const initialState: SubtitleState = {
  start: "",
  end: "",
  text: "",
  audioFileUrl: "",
};

export const subtitleSlice = createSlice({
  name: "subtitle",
  initialState,
  reducers: {
    setSubtitle: (state, action: PayloadAction<SubtitleState>) => {
      return action.payload;
    },
  },
});

export const { setSubtitle } = subtitleSlice.actions;
