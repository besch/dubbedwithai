import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import srtToObject, { SrtObject } from "@/lib/srtParser";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const GENERATE_SUBTITLE_AUDIO_FILE_FOR_HOW_MANY_MINUTES = 3 * 60 * 1000;

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, "");
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

  console.log("baseUrl", process.env.API_URL);

  try {
    const baseUrl = process.env.API_URL;

    // 1. Fetch subtitles
    const subtitlesResponse = await fetch(
      `${baseUrl}/api/opensubtitles/fetch-subtitles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      }
    );
    const { srtContent } = await subtitlesResponse.json();
    const cleanedSrtContent = stripHtmlTags(srtContent);

    // 2. Save SRT content to Google Storage
    const bucketName = "dubbed_with_ai";
    const fileName = `${imdbID}/${subtitleID}/subtitles.srt`;
    await storage.bucket(bucketName).file(fileName).save(cleanedSrtContent);

    // 3. Parse subtitles
    const parsedSubtitles = srtToObject(cleanedSrtContent);

    // 4. Filter subtitles for first 1 minute
    const filteredSubtitles = parsedSubtitles.filter((sub: SrtObject) => {
      const startTime = timeToMs(sub.start || "");
      return startTime < GENERATE_SUBTITLE_AUDIO_FILE_FOR_HOW_MANY_MINUTES;
    });

    // 5. Generate and upload audio for each subtitle
    for (const sub of filteredSubtitles) {
      if (sub.start && sub.end && sub.text) {
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
