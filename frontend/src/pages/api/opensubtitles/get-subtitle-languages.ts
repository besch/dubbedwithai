// pages/api/opensubtitles/fetch-subtitle-languages.ts
import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

const fetchSubtitleLanguages = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res, cors);

  try {
    const { imdbID, languageCode } = req.body;

    const response = await fetch(
      `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbID}&languages=${languageCode}`,
      {
        headers: {
          "User-Agent": "ONEDUB v0.1",
          "Api-Key": process.env.OPENSUBTITLES_API_KEY!,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Sort subtitles by priority: new_download_count, download_count, votes, rating
    const sortedSubtitles = data.data.sort((a: any, b: any) => {
      if (a.attributes.new_download_count !== b.attributes.new_download_count) {
        return (
          b.attributes.new_download_count - a.attributes.new_download_count
        );
      }
      if (a.attributes.download_count !== b.attributes.download_count) {
        return b.attributes.download_count - a.attributes.download_count;
      }
      if (a.attributes.votes !== b.attributes.votes) {
        return b.attributes.votes - a.attributes.votes;
      }
      return b.attributes.ratings - a.attributes.ratings;
    });

    const bestSubtitle = sortedSubtitles[0];

    return res.status(200).json({
      data: bestSubtitle,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitleLanguages;
