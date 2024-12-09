"use server";

import srtToObject from "srt-to-obj";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const getSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  const absPath = path.join(
    "C:",
    "Users",
    "user",
    "Downloads",
    "subtitles.srt"
  );

  srtToObject(absPath).then((subtitles) => {
    res.status(200).json({ subtitles });
  });
};

export default getSubtitles;
