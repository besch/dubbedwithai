import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { logApiRequest } from "@/firebase/firebase-config";

const searchMovies = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const { text } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${text}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    await logApiRequest({
      endpoint: "search-movies",
      ip: ip as string,
      movieName: text,
      time: Date.now(),
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error searching movies:", error);
    await logApiRequest({
      endpoint: "search-movies",
      ip: ip as string,
      movieName: text,
      subtitlesFound: false,
      time: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default searchMovies;
