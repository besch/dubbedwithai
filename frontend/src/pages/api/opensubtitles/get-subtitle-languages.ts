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

    // Process the data to get unique languages sorted by rating
    const languageMap = new Map();

    data.data.forEach((subtitle: any) => {
      const language = subtitle.attributes.language;
      const rating = subtitle.attributes.ratings;

      if (
        !languageMap.has(language) ||
        rating > languageMap.get(language).attributes.ratings
      ) {
        languageMap.set(language, subtitle);
      }
    });

    const uniqueLanguages = Array.from(languageMap.values());

    // Sort languages by rating in descending order
    uniqueLanguages.sort((a, b) => b.attributes.ratings - a.attributes.ratings);

    res.status(200).json({
      total_count: uniqueLanguages.length,
      data: uniqueLanguages,
    });
  } catch (err) {
    console.error("Error fetching subtitle languages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default getSubtitleLanguages;
