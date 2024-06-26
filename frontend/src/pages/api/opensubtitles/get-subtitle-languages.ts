import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

const getSubtitleLanguages = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res, cors);

  try {
    const response = await fetch(
      `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${req.body.imdbID}`,
      {
        headers: {
          "User-Agent": "ANYDUB v0.1",
          "Api-Key": "StgOyEOSf17htjjIp7JrjDtK1DhT6tSC",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching subtitle languages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default getSubtitleLanguages;
