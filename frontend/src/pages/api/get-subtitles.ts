"use server";

import srtToObject from "srt-to-obj";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const getSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  srtToObject(path.resolve(__dirname, "../../../../assets/subtitles.srt")).then(
    (subtitles) => {
      res.status(200).json({ subtitles });
    }
  );
};

export default getSubtitles;
