// thunkActions.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { convertVideoToBlob } from "@/utils/videoConversion";

export const uploadAndConvertVideo = createAsyncThunk(
  "video/uploadAndConvert",
  async (file: File) => {
    const videoBlob = await convertVideoToBlob(file);
    return videoBlob;
  }
);
