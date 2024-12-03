import unzipper from "unzipper";
import fetch from "node-fetch";
import detectEncoding from "detect-file-encoding-and-language";
import iconv from "iconv-lite";
import { translateSubtitles } from "./subtitles";

export interface SubtitleResult {
  content: string;
  generated: boolean;
  language: string;
}

export async function fetchSubdlSubtitles(
  imdbID: string,
  targetLanguage: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<SubtitleResult | null> {
  const languages = ["en", "es", "fr", "ru", "de", "it", "pt", "ja", "zh"];
  const languageString = `${targetLanguage},${languages.join(",")}`;

  // Try with target language first
  const result = await tryFetchSubtitles(
    imdbID,
    languageString,
    seasonNumber,
    episodeNumber
  );

  // If failed, try with fallback languages
  if (!result?.subtitles?.length) {
    const fallbackResult = await tryFetchSubtitles(
      imdbID,
      languages.join(","),
      seasonNumber,
      episodeNumber
    );
    if (!fallbackResult?.subtitles?.length) {
      return null;
    }
    return processSubtitleResult(
      fallbackResult.subtitles,
      targetLanguage,
      seasonNumber,
      episodeNumber
    );
  }

  return processSubtitleResult(
    result.subtitles,
    targetLanguage,
    seasonNumber,
    episodeNumber
  );
}

async function tryFetchSubtitles(
  imdbID: string,
  languages: string,
  seasonNumber?: number,
  episodeNumber?: number
) {
  const url = `https://api.subdl.com/api/v1/subtitles?api_key=${
    process.env.SUBDL_API_KEY
  }&imdb_id=${imdbID}&languages=${languages}${
    seasonNumber !== undefined ? `&season_number=${seasonNumber}` : ""
  }${episodeNumber !== undefined ? `&episode_number=${episodeNumber}` : ""}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.success === false ? null : data;
  } catch (error) {
    console.error("Error fetching from Subdl:", error);
    return null;
  }
}

async function processSubtitleResult(
  subtitles: any[],
  targetLanguage: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<SubtitleResult> {
  // Try target language subtitles first
  const targetLangSubtitles = subtitles.filter(
    (sub) => sub.language.toLowerCase() === targetLanguage.toLowerCase()
  );

  // Try each subtitle in target language
  for (const subtitle of targetLangSubtitles) {
    try {
      const content = await downloadAndExtractSubtitle(
        subtitle.url,
        seasonNumber,
        episodeNumber
      );
      return { content, generated: false, language: targetLanguage };
    } catch (error) {
      console.warn(`Failed to download subtitle: ${subtitle.url}`, error);
    }
  }

  // If target language fails or not found, try other languages and translate
  for (const subtitle of subtitles) {
    try {
      const content = await downloadAndExtractSubtitle(
        subtitle.url,
        seasonNumber,
        episodeNumber
      );
      const translatedContent = await translateSubtitles(
        content,
        subtitle.language,
        targetLanguage
      );
      return {
        content: translatedContent,
        generated: true,
        language: targetLanguage,
      };
    } catch (error) {
      console.warn(`Failed to download subtitle: ${subtitle.url}`, error);
      continue;
    }
  }

  throw new Error("Failed to process any subtitles");
}

export async function downloadAndExtractSubtitle(
  url: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://dl.subdl.com${url}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.buffer();
      const zip = await unzipper.Open.buffer(buffer);
      const subtitleBuffer = await findSubtitleFile(
        zip,
        seasonNumber,
        episodeNumber
      );

      // Detect and handle encoding
      const encodingInfo = await detectEncoding(subtitleBuffer);
      const encoding = encodingInfo.encoding || "utf-8";
      return iconv.decode(subtitleBuffer, encoding);
    } catch (error) {
      lastError = error as Error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }

  throw lastError || new Error("Failed to download subtitle after retries");
}

function findSubtitleFile(
  zip: unzipper.CentralDirectory,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<Buffer> {
  const patterns =
    seasonNumber !== undefined
      ? getEpisodePatterns(seasonNumber, episodeNumber!)
      : [];

  // Convert files to array and type it correctly
  const files = Array.from(zip.files);

  // Try to find matching file
  const entry =
    patterns.length > 0
      ? files.find((entry) =>
          patterns.some((pattern) => pattern.test(entry.path))
        )
      : files.find((entry) => entry.path.toLowerCase().endsWith(".srt"));

  if (!entry) {
    throw new Error("No matching subtitle file found");
  }

  return entry.buffer();
}

function getEpisodePatterns(
  seasonNumber: number,
  episodeNumber: number
): RegExp[] {
  return [
    new RegExp(
      `S${String(seasonNumber).padStart(2, "0")}E${String(
        episodeNumber
      ).padStart(2, "0")}.*\\.srt$`,
      "i"
    ),
    new RegExp(
      `${seasonNumber}x${String(episodeNumber).padStart(2, "0")}.*\\.srt$`,
      "i"
    ),
    new RegExp(`^${String(episodeNumber).padStart(2, "0")}\\s*-.*\\.srt$`, "i"),
    new RegExp(
      `-\\s*S${String(seasonNumber).padStart(2, "0")}E${String(
        episodeNumber
      ).padStart(2, "0")}.*\\.srt$`,
      "i"
    ),
  ];
}
