import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

const checkDubbingAvailability = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res, cors);

  try {
    const response = await fetch(
      `https://storage.googleapis.com/dubbed_with_ai/${req.body.imdbID}/languages/${req.body.language}`,
      {
        headers: {
          "User-Agent": "ANYDUB v0.1",
          "Api-Key": "StgOyEOSf17htjjIp7JrjDtK1DhT6tSC",
          "Content-Type": "application/json",
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

export default checkDubbingAvailability;
