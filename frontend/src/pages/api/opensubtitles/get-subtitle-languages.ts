import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getSubtitleLanguages = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res, cors);

  // const token = req.headers.authorization?.split(" ")[1];

  // if (!token) {
  //   return res.status(401).json({ error: "No token provided" });
  // }

  try {
    // let userId: string | undefined;

    // // Try to verify as ID token first
    // try {
    //   const ticket = await client.verifyIdToken({
    //     idToken: token,
    //     audience: process.env.GOOGLE_CLIENT_ID,
    //   });
    //   const payload = ticket.getPayload();
    //   userId = payload?.sub;
    // } catch (idTokenError) {
    //   // If ID token verification fails, try to verify as access token
    //   try {
    //     const userInfo = await client.getTokenInfo(token);
    //     userId = userInfo.sub;
    //   } catch (accessTokenError) {
    //     console.error("Token verification failed:", accessTokenError);
    //     return res.status(401).json({ error: "Invalid token" });
    //   }
    // }

    // if (!userId) {
    //   return res.status(401).json({ error: "Invalid token" });
    // }

    const response = await fetch(
      `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${req.body.imdbID}`,
      {
        headers: {
          "User-Agent": "ANYDUB v0.1",
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

    // Process the data to get unique languages sorted by rating
    const languageMap = new Map();

    // console.log(data.data);

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
    uniqueLanguages.sort(
      (a, b) => b.attributes.download_count - a.attributes.download_count
    );

    const languagesWithProperlySetLanguageCode = uniqueLanguages.filter(
      (language: any) => language.attributes.language
    );

    return res.status(200).json({
      total_count: languagesWithProperlySetLanguageCode.length,
      data: languagesWithProperlySetLanguageCode,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default getSubtitleLanguages;
