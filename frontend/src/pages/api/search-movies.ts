import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";

const searchMovies = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const { text, url } = req.body;
  const startTime = new Date();
  const logEntry: LogEntry = {
    endpoint: "/api/search-movies",
    parameters: { text },
    ip_address:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "",
    timestamp: startTime.toISOString(),
    success: false,
    steps: {},
    url,
  };

  try {
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${text}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    logEntry.success = true;
    await logApiRequest(logEntry);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error searching movies:", error);
    logEntry.error_message = "Error searching movies";
    logEntry.error_code = "500";
    await logApiRequest(logEntry);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default searchMovies;
