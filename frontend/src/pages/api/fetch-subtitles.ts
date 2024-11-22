import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "@/lib/google-storage-config";
import fetch from "node-fetch";
import unzipper from "unzipper";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";
import { translateSubtitles } from "@/utils/subtitles";
import detectEncoding from "detect-file-encoding-and-language";
import iconv from "iconv-lite";

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
    endpoint: "/api/opensubtitles/fetch-subtitles",
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
    let filePath: string;
    if (seasonNumber !== undefined && episodeNumber !== undefined) {
      // TV series
      filePath = `${imdbID}/${seasonNumber}/${episodeNumber}/${languageCode}/subtitles.srt`;
    } else {
      // Movie
      filePath = `${imdbID}/${languageCode}/subtitles.srt`;
    }

    // Step 1: Check if subtitles exist in Google Storage
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
      await logApiRequest(logEntry);
      return res.status(200).json({ srtContent });
    }

    // Step 2 & 3: Query Subdl or generate/translate if necessary
    const { srtContent, generated } = await getOrGenerateSubtitles(
      imdbID,
      languageCode,
      seasonNumber,
      episodeNumber
    );

    await storage.bucket(bucketName).file(filePath).save(srtContent);

    // Log steps
    logEntry.steps = {
      checkedGoogleStorage: fileExists,
      queriedSubdl: !fileExists,
      generatedSubtitles: !fileExists && generated,
    };

    logEntry.success = true;
    await logApiRequest(logEntry);

    return res.status(200).json({
      srtContent,
      generated,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    logEntry.error_message = "Internal Server Error";

    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getOrGenerateSubtitles(
  imdbID: string,
  targetLanguage: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<{ srtContent: string; generated: boolean }> {
  const result = await getBestSubtitle(
    imdbID,
    targetLanguage,
    seasonNumber,
    episodeNumber
  );

  if (!result) {
    throw new Error("No subtitles found for the given content");
  }

  return {
    srtContent: result.content,
    generated: result.generated,
  };
}

async function getBestSubtitle(
  imdbID: string,
  targetLanguage: string,
  seasonNumber?: number,
  episodeNumber?: number
) {
  const languages = ["en", "es", "fr", "ru", "de", "it", "pt", "ja", "zh"];
  const languageString = `${targetLanguage},${languages.join(",")}`;

  let url = `https://api.subdl.com/api/v1/subtitles?api_key=${process.env.SUBDL_API_KEY}&imdb_id=${imdbID}&languages=${languageString}`;

  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    url += `&season_number=${seasonNumber}&episode_number=${episodeNumber}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.success === false) {
    const fallbackLanguage = languages.join(",");
    const fallbackUrl = `https://api.subdl.com/api/v1/subtitles?api_key=${process.env.SUBDL_API_KEY}&imdb_id=${imdbID}&languages=${fallbackLanguage}`;

    const fallbackResponse = await fetch(fallbackUrl);
    if (!fallbackResponse.ok) {
      throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
    }

    const fallbackData = await fallbackResponse.json();
    if (!fallbackData.subtitles || fallbackData.subtitles.length === 0) {
      return null;
    }

    const bestSubtitle = fallbackData.subtitles[0];
    const subtitleContent = await downloadAndExtractSubtitle(
      bestSubtitle.url,
      seasonNumber,
      episodeNumber
    );

    // Translate subtitles to the target language
    const translatedContent = await translateSubtitles(
      subtitleContent,
      bestSubtitle.language,
      targetLanguage
    );

    return {
      content: translatedContent,
      generated: true,
    };
  }

  if (!data.subtitles || data.subtitles.length === 0) {
    return null;
  }

  // Find subtitles in the target language
  const targetLangSubtitle = data.subtitles.find(
    (sub: any) => sub.language.toLowerCase() === targetLanguage.toLowerCase()
  );

  if (targetLangSubtitle) {
    try {
      const subtitleContent = await downloadAndExtractSubtitle(
        targetLangSubtitle.url,
        seasonNumber,
        episodeNumber
      );
      return {
        content: subtitleContent,
        generated: false,
      };
    } catch (error) {
      const bestSubtitle = data.subtitles[0];
      const subtitleContent = await downloadAndExtractSubtitle(
        bestSubtitle.url,
        seasonNumber,
        episodeNumber
      );

      // Translate subtitles to the target language since we're using a different language
      const translatedContent = await translateSubtitles(
        subtitleContent,
        bestSubtitle.language,
        targetLanguage
      );

      return {
        content: translatedContent,
        generated: true,
      };
    }
  }

  // If target language not found, use the first available subtitle and translate
  const bestSubtitle = data.subtitles[0];
  const subtitleContent = await downloadAndExtractSubtitle(
    bestSubtitle.url,
    seasonNumber,
    episodeNumber
  );

  // Translate subtitles to the target language
  const translatedContent = await translateSubtitles(
    subtitleContent,
    bestSubtitle.language,
    targetLanguage
  );

  return {
    content: translatedContent,
    generated: true,
  };
}

async function downloadAndExtractSubtitle(
  url: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<string> {
  const response = await fetch(`https://dl.subdl.com${url}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const buffer = await response.buffer();
  const zip = await unzipper.Open.buffer(buffer);

  let subtitleBuffer: Buffer;

  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    // TV show
    const episodePatterns = [
      // Standard pattern: S01E01
      new RegExp(
        `S${String(seasonNumber).padStart(2, "0")}E${String(
          episodeNumber
        ).padStart(2, "0")}.*\\.srt$`,
        "i"
      ),
      // Simple pattern: 01x01 or 1x01
      new RegExp(
        `${seasonNumber}x${String(episodeNumber).padStart(2, "0")}.*\\.srt$`,
        "i"
      ),
      // Episode number only: 01 - Episode Title
      new RegExp(
        `^${String(episodeNumber).padStart(2, "0")}\\s*-.*\\.srt$`,
        "i"
      ),
      // Show Name - S01E01
      new RegExp(
        `-\\s*S${String(seasonNumber).padStart(2, "0")}E${String(
          episodeNumber
        ).padStart(2, "0")}.*\\.srt$`,
        "i"
      ),
    ];

    const matchingEntry = zip.files.find((entry) =>
      episodePatterns.some((pattern) => pattern.test(entry.path))
    );

    if (matchingEntry) {
      subtitleBuffer = await matchingEntry.buffer();
    } else {
      throw new Error(
        "No matching subtitle file found for the specified episode"
      );
    }
  } else {
    // Movie
    const srtEntry = zip.files.find((entry) =>
      entry.path.toLowerCase().endsWith(".srt")
    );
    if (srtEntry) {
      subtitleBuffer = await srtEntry.buffer();
    } else {
      throw new Error("No .srt file found in the downloaded zip");
    }
  }

  // Detect encoding
  const encodingInfo = await detectEncoding(subtitleBuffer);
  const encoding = encodingInfo.encoding || "utf-8";

  // Convert buffer to string using detected encoding
  const subtitleContent = iconv.decode(subtitleBuffer, encoding);

  return subtitleContent;
}
