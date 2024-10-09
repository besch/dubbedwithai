import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import OpenAI from "openai";
import languageCodes from "@/lib/languageCodes";
import fetch from "node-fetch";
import unzipper from "unzipper";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const bucketName = "dubbed_with_ai";

export default async function fetchSubtitles(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, languageCode, seasonNumber, episodeNumber, url } = req.body;
  const startTime = new Date();

  const logEntry: LogEntry = {
    endpoint: "/api/opensubtitles/fetch-subtitles",
    parameters: { imdbID, languageCode, seasonNumber, episodeNumber },
    ip_address:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "",
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

  if (data.success === false && data.error === "Language error") {
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
    const subtitleContent = await downloadAndExtractSubtitle(
      targetLangSubtitle.url,
      seasonNumber,
      episodeNumber
    );
    return {
      content: subtitleContent,
      generated: false,
    };
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

  let subtitleContent = "";

  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    // TV show
    const episodePattern = new RegExp(
      `S${String(seasonNumber).padStart(2, "0")}E${String(
        episodeNumber
      ).padStart(2, "0")}.*\\.srt$`,
      "i"
    );
    const matchingEntry = zip.files.find((entry) =>
      episodePattern.test(entry.path)
    );

    if (matchingEntry) {
      subtitleContent = await matchingEntry
        .buffer()
        .then((buf) => buf.toString("utf8"));
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
      subtitleContent = await srtEntry
        .buffer()
        .then((buf) => buf.toString("utf8"));
    } else {
      throw new Error("No .srt file found in the downloaded zip");
    }
  }

  return cleanSrtContent(subtitleContent);
}

async function translateSubtitles(
  srtContent: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const lines = srtContent.split("\n");
  const batches = [];
  const batchSize = 100;

  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize).join("\n"));
  }

  const translatedBatches = await Promise.all(
    batches.map((batch) =>
      translateBatch(batch, sourceLanguage, targetLanguage)
    )
  );

  return translatedBatches.join("\n");
}

async function translateBatch(
  batch: string,
  sourceLanguage: string,
  targetLanguage: string,
  retries = 3
): Promise<string> {
  try {
    const sourceLangName = languageCodes[sourceLanguage] || sourceLanguage;
    const targetLangName = languageCodes[targetLanguage] || targetLanguage;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional subtitle translator. Translate the following SRT subtitle content from ${sourceLangName} to ${targetLangName}. Strictly adhere to these SRT formatting rules:
            1. Each subtitle entry consists of four parts:
              a) A sequential number
              b) The timecode line with start and end times (--:--:--,--- --> --:--:--,---)
              c) The subtitle text (one or many lines).
              d) A blank line to separate entries

            2. Maintain the exact timecodes from the original subtitles.

            3. Translate only the subtitle text. Do not alter numbers or timecodes.

            4. Keep line breaks within the subtitle text as in the original.

            5. Ensure there's always a blank line between subtitle entries.

            6. Remove any formatting tags like <i> for italics if present.

            7. If subtitle text is empty or translated text is empty or corrupted somehow, do not include this subtitle

            Example of correct formatting:

            "1
            00:00:42,625 --> 00:00:44,793
            Translated text line 1
            Translated text line 2

            2
            00:00:47,797 --> 00:00:48,923
            Short translated line

            3
            00:00:49,173 --> 00:00:52,593
            Italicized translated text
            Italicized translated text
            Italicized translated text
            Italicized translated text"

            Translate accurately while maintaining natural language flow in ${targetLangName}.`,
        },
        { role: "user", content: batch },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying translation... Attempts left: ${retries - 1}`);
      return await translateBatch(
        batch,
        sourceLanguage,
        targetLanguage,
        retries - 1
      );
    }
    throw error;
  }
}

function cleanSrtContent(srtContent: string): string {
  // Split the content into individual subtitle entries
  let entries = srtContent.split("\n\n");

  // Filter out entries that start with '#'
  entries = entries.filter((entry) => {
    const lines = entry.split("\n");
    return lines.length < 3 || !lines[2].trim().startsWith("#");
  });

  // Join the remaining entries back together
  let cleaned = entries.join("\n\n");

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Remove bracketed descriptions like [Phone ringing] or [Sigh]
  cleaned = cleaned.replace(/\[.*?\]/g, "");

  // Trim whitespace from each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove empty lines (keeping newlines for SRT format)
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, "");

  return cleaned;
}
