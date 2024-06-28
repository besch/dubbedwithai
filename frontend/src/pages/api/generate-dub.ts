import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

interface Subtitle {
  start: string;
  end: string;
  text: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, subtitleID, fileId } = req.body;

  if (!imdbID || !subtitleID || !fileId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // 1. Fetch and parse subtitles
    const subtitlesResponse = await fetch(
      "/api/opensubtitles/fetch-subtitles",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      }
    );
    const parsedSubtitles = await subtitlesResponse.json();

    // 2. Filter subtitles for first 3 minutes
    const threeMinutesInMs = 3 * 60 * 1000;
    const filteredSubtitles = parsedSubtitles.filter((sub: Subtitle) => {
      const startTime = timeToMs(sub.start);
      return startTime < threeMinutesInMs;
    });

    // 3. Generate and upload audio for each subtitle
    for (const sub of filteredSubtitles) {
      const audioFileName = `dubbed_with_ai/${imdbID}/${subtitleID}/${timeToMs(
        sub.start
      )}-${timeToMs(sub.end)}.mp3`;
      await fetch("/api/openai/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sub.text, fileName: audioFileName }),
      });
    }

    res.status(200).json({ message: "Dubbing completed successfully" });
  } catch (error) {
    console.error("Error in generate-dub:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function timeToMs(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(":");
  const [secs, ms] = seconds.split(",");
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(secs) * 1000 +
    parseInt(ms)
  );
}
