import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getSubtitleLanguages = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res, cors);

  // Check for authentication token
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Token is valid, proceed with the API request
    const response = await fetch(
      `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${req.body.imdbID}`,
      {
        headers: {
          "User-Agent": "ANYDUB v0.1",
          "Api-Key": process.env.NEXT_PUBLIC_OPENSUBTITLES_API_KEY!,
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

    console.log("subtitles", data.data);

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
    console.error("Error:", err);
    if (err instanceof Error && err.message.includes("Invalid token")) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export default getSubtitleLanguages;
