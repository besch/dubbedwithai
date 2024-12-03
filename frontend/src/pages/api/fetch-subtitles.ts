import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "@/lib/google-storage-config";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";
import { fetchSubdlSubtitles } from "@/utils/subtitleUtils";

const bucketName = "dubbed_with_ai";

export default async function fetchSubtitles(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, languageCode, seasonNumber, episodeNumber, url } = req.body;
  const startTime = new Date();
  const ipAddress =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "";

  const logEntry: LogEntry = {
    endpoint: "/api/fetch-subtitles",
    parameters: { imdbID, languageCode, seasonNumber, episodeNumber },
    ip_address: ipAddress,
    timestamp: startTime.toISOString(),
    success: false,
    steps: {},
    url,
  };

  if (!imdbID || !languageCode) {
    logEntry.error_message = "Missing imdbID or languageCode parameter";
    logEntry.error_code = "400";
    await logApiRequest(logEntry);
    return res.status(400).json({ error: logEntry.error_message });
  }

  try {
    const filePath = getFilePath(
      imdbID,
      languageCode,
      seasonNumber,
      episodeNumber
    );

    // Check Google Storage first
    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();
    if (fileExists) {
      const [fileContents] = await storage
        .bucket(bucketName)
        .file(filePath)
        .download();
      const srtContent = fileContents.toString("utf-8");
      logEntry.success = true;
      await logApiRequest(logEntry);
      return res.status(200).json({ srtContent, generated: false });
    }

    // Fetch from Subdl
    const result = await fetchSubdlSubtitles(
      imdbID,
      languageCode,
      seasonNumber,
      episodeNumber
    );

    if (!result) {
      throw new Error("No subtitles found");
    }

    // Save to Google Storage
    await storage.bucket(bucketName).file(filePath).save(result.content);

    logEntry.steps = {
      checkedGoogleStorage: true,
      queriedSubdl: true,
      generatedSubtitles: result.generated,
    };

    logEntry.success = true;
    await logApiRequest(logEntry);

    return res.status(200).json({
      srtContent: result.content,
      generated: result.generated,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    logEntry.error_message =
      error instanceof Error ? error.message : "Internal Server Error";
    await logApiRequest(logEntry);
    res.status(500).json({ error: logEntry.error_message });
  }
}

function getFilePath(
  imdbID: string,
  languageCode: string,
  seasonNumber?: number,
  episodeNumber?: number
): string {
  return seasonNumber !== undefined && episodeNumber !== undefined
    ? `${imdbID}/${seasonNumber}/${episodeNumber}/${languageCode}/subtitles.srt`
    : `${imdbID}/${languageCode}/subtitles.srt`;
}
