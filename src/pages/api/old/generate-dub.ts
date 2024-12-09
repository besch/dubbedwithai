import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import srtToObject, { SrtObject } from "@/lib/srtParser";
import storage from "@/lib/google-storage-config";

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

  try {
    const baseUrl = process.env.API_URL;

    // 1. Fetch subtitles
    const subtitlesResponse = await fetch(`${baseUrl}/api/fetch-subtitles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    const { srtContent } = await subtitlesResponse.json();
    const cleanedSrtContent = stripHtmlTags(srtContent);

    // 2. Save SRT content to Google Storage
    const bucketName = "dubbed_with_ai";
    const fileName = `${imdbID}/${subtitleID}/subtitles.srt`;
    await storage.bucket(bucketName).file(fileName).save(cleanedSrtContent);

    // Continue with audio generation process
    const parsedSubtitles = srtToObject(cleanedSrtContent);

    const filteredSubtitles = parsedSubtitles.filter((sub: SrtObject) => {
      const startTime = timeToMs(sub.start || "");
      return startTime < GENERATE_SUBTITLE_AUDIO_FILE_FOR_HOW_MANY_MINUTES;
    });

    for (const sub of filteredSubtitles) {
      if (sub.start && sub.end && sub.text) {
        const audioFileName = `${imdbID}/${subtitleID}/${timeToMs(
          sub.start
        )}-${timeToMs(sub.end)}.mp3`;

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

    console.log("Audio generation completed");
  } catch (error) {
    console.error("Error in generate-dub:", error);
    // Note: We can't send an error response here as we've already sent a 200 response
    // You might want to implement a separate error logging or notification system
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
