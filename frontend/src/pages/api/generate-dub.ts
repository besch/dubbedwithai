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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    // 1. Fetch and parse subtitles
    const subtitlesResponse = await fetch(
      `${baseUrl}/api/opensubtitles/fetch-subtitles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      }
    );
    const parsedSubtitles = await subtitlesResponse.json();

    if (!Array.isArray(parsedSubtitles)) {
      return res.status(500).json({ error: "Invalid subtitle format" });
    }

    // 2. Filter subtitles for first 1 minutes
    const oneMinuteInMs = 1 * 60 * 1000;
    const filteredSubtitles = parsedSubtitles.filter((sub: Subtitle) => {
      const startTime = timeToMs(sub.start);
      return startTime < oneMinuteInMs;
    });

    // 3. Generate and upload audio for each subtitle
    for (const sub of filteredSubtitles) {
      const audioFileName = `${imdbID}/${subtitleID}/${timeToMs(
        sub.start
      )}-${timeToMs(sub.end)}.mp3`;

      // Check if the file exists
      const fileExistsResponse = await fetch(
        `${baseUrl}/api/google-storage/check-file-exists`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: audioFileName }),
        }
      );
      const { exists } = await fileExistsResponse.json();

      if (!exists) {
        await fetch(`${baseUrl}/api/openai/generate-audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sub.text, fileName: audioFileName }),
        });
      }
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
