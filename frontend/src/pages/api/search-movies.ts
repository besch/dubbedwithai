import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

const searchMovies = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  try {
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=508321b3&s=${req.body.text}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error searching movies:", error);
  }
};

export default searchMovies;
