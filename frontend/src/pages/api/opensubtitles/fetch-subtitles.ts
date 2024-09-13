import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import OpenAI from "openai";
import languageCodes from "@/lib/languageCodes";
import { logApiRequest } from "@/firebase/firebase-config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bucketName = "dubbed_with_ai";

export default async function fetchSubtitles(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, languageCode, seasonNumber, episodeNumber } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!imdbID || !languageCode) {
    await logApiRequest({
      endpoint: "fetch-subtitles",
      ip: ip as string,
      movieName: imdbID,
      language: languageCode,
      season: seasonNumber,
      episode: episodeNumber,
      subtitlesFound: false,
      time: Date.now(),
    });
    return res
      .status(400)
      .json({ error: "Missing imdbID or languageCode parameter" });
  }

  try {
    let filePath: string;
    if (seasonNumber !== undefined && episodeNumber !== undefined) {
      filePath = `${imdbID}/${seasonNumber}/${episodeNumber}/${languageCode}/subtitles.srt`;
    } else {
      filePath = `${imdbID}/${languageCode}/subtitles.srt`;
    }

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
      await logApiRequest({
        endpoint: "fetch-subtitles",
        ip: ip as string,
        movieName: imdbID,
        language: languageCode,
        season: seasonNumber,
        episode: episodeNumber,
        subtitlesFound: true,
        subtitlesStep: "storage",
        time: Date.now(),
      });
      return res.status(200).json({
        subtitleInfo: {
          attributes: {
            language: languageCode,
            language_name: languageCodes[languageCode] || languageCode,
          },
        },
        srtContent: srtContent,
      });
    }

    const { subtitleInfo, srtContent, generated } =
      await getOrGenerateSubtitles(
        imdbID,
        languageCode,
        seasonNumber,
        episodeNumber
      );

    await storage.bucket(bucketName).file(filePath).save(srtContent);

    await logApiRequest({
      endpoint: "fetch-subtitles",
      ip: ip as string,
      movieName: imdbID,
      language: languageCode,
      season: seasonNumber,
      episode: episodeNumber,
      subtitlesFound: true,
      subtitlesStep: generated ? "generated" : "api",
      time: Date.now(),
    });

    return res.status(200).json({
      subtitleInfo,
      srtContent,
      generated,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    await logApiRequest({
      endpoint: "fetch-subtitles",
      ip: ip as string,
      movieName: imdbID,
      language: languageCode,
      season: seasonNumber,
      episode: episodeNumber,
      subtitlesFound: false,
      time: Date.now(),
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getOrGenerateSubtitles(
  imdbID: string,
  targetLanguage: string,
  seasonNumber?: number,
  episodeNumber?: number
): Promise<{ subtitleInfo: any; srtContent: string; generated: boolean }> {
  const bestSubtitle = await getBestSubtitle(
    imdbID,
    seasonNumber,
    episodeNumber
  );

  if (!bestSubtitle) {
    throw new Error("No subtitles found for the given content");
  }

  let filePath: string;
  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    // TV series
    filePath = `${imdbID}/${seasonNumber}/${episodeNumber}/${targetLanguage}/subtitles.srt`;
  } else {
    // Movie
    filePath = `${imdbID}/${targetLanguage}/subtitles.srt`;
  }

  // Use the formatted content from getBestSubtitle
  const formattedSrtContent = bestSubtitle.formattedContent;

  if (bestSubtitle.attributes.language === targetLanguage) {
    // If the best subtitle is already in the target language, return it as is
    return {
      subtitleInfo: {
        attributes: {
          language: targetLanguage,
          language_name: languageCodes[targetLanguage] || targetLanguage,
        },
      },
      srtContent: formattedSrtContent,
      generated: false,
    };
  }

  // Translate subtitles to the target language
  const translatedContent = await translateSubtitles(
    formattedSrtContent,
    bestSubtitle.attributes.language,
    targetLanguage
  );

  return {
    subtitleInfo: {
      attributes: {
        language: targetLanguage,
        language_name: languageCodes[targetLanguage] || targetLanguage,
      },
    },
    srtContent: translatedContent,
    generated: true,
  };
}

async function getBestSubtitle(
  imdbID: string,
  seasonNumber?: number,
  episodeNumber?: number
) {
  let url = `https://api.opensubtitles.com/api/v1/subtitles?`;

  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    // TV series
    url += `parent_imdb_id=${imdbID}&season_number=${seasonNumber}&episode_number=${episodeNumber}`;
  } else {
    // Movie
    url += `imdb_id=${imdbID}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.OPENSUBTITLES_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Priority languages (in order of preference)
  const priorityLanguages = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ja",
    "zh",
    "ko",
  ];

  // Priority release keywords
  const priorityReleaseKeywords = [
    "bluray",
    "web-dl",
    "webdl",
    "webrip",
    "bdrip",
    "dvdrip",
    "hdrip",
  ];

  // Function to calculate score for a subtitle
  const calculateScore = (subtitle: any) => {
    let score = 0;
    const attrs = subtitle.attributes;

    // Prefer HD subtitles
    if (attrs.hd) score += 5;

    // Score based on download count (1 point per 100 downloads, max 10 points)
    score += Math.min(Math.floor(attrs.download_count / 100), 10);

    // Score based on rating (0-10 points)
    score += attrs.ratings * 2; // ratings are from 0-5, so we double it

    // Prefer more recent uploads (lose 1 point per month old, max 12 points lost)
    const monthsOld =
      (new Date().getTime() - new Date(attrs.upload_date).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    score -= Math.min(Math.floor(monthsOld), 12);

    // Prefer trusted uploaders
    if (attrs.from_trusted) score += 3;

    // Prefer certain languages
    const languageIndex = priorityLanguages.indexOf(attrs.language);
    if (languageIndex !== -1) {
      score += 5 - languageIndex; // 5 points for first language, 4 for second, etc.
    }

    // Prefer certain release types
    const release = attrs.release.toLowerCase();
    for (let i = 0; i < priorityReleaseKeywords.length; i++) {
      if (release.includes(priorityReleaseKeywords[i])) {
        score += 5 - i; // 5 points for first keyword, 4 for second, etc.
        break;
      }
    }

    return score;
  };

  // Sort subtitles by score
  const sortedSubtitles = data.data.sort(
    (a: any, b: any) => calculateScore(b) - calculateScore(a)
  );

  // Return the best subtitle, or null if no subtitles found
  if (sortedSubtitles.length > 0) {
    const bestSubtitle = sortedSubtitles[0];
    const fileId = bestSubtitle.attributes.files[0].file_id;

    // Download the subtitle content
    const rawSrtContent = await downloadSubtitles(fileId);

    // Format the subtitle content
    const formattedSrtContent = formatSubtitles(rawSrtContent);

    // Return the formatted content along with the subtitle info
    return {
      ...bestSubtitle,
      formattedContent: formattedSrtContent,
    };
  }

  return null;
}

async function downloadSubtitles(fileId: string): Promise<string> {
  const downloadLink = await fetchSubtitlesDownloadLink(fileId);
  const srtContent = await downloadSrtContent(downloadLink);
  const strContentClean = cleanSrtContent(srtContent);

  return strContentClean;
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

async function fetchSubtitlesDownloadLink(fileId: string): Promise<string> {
  const response = await fetch(
    `https://api.opensubtitles.com/api/v1/download`,
    {
      method: "POST",
      headers: {
        "User-Agent": "ONEDUB v0.1",
        "Api-Key": process.env.OPENSUBTITLES_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.link;
}

async function downloadSrtContent(link: string): Promise<string> {
  const response = await fetch(link);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

function cleanSrtContent(srtContent: string): string {
  // Remove HTML tags
  let cleaned = srtContent.replace(/<[^>]*>/g, "");

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

function formatSubtitles(srtContent: string): string {
  const lines = srtContent.split("\n");
  let formattedContent = "";
  let currentEntry = [];
  let subtitleNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      if (currentEntry.length >= 3) {
        // Format and add the current entry
        formattedContent += `${subtitleNumber}\n`;
        formattedContent += `${currentEntry[1]}\n`;
        formattedContent += currentEntry.slice(2).join("\n") + "\n\n";
        subtitleNumber++;
      }
      currentEntry = [];
    } else {
      currentEntry.push(line);
    }
  }

  // Add the last entry if it exists
  if (currentEntry.length >= 3) {
    formattedContent += `${subtitleNumber}\n`;
    formattedContent += `${currentEntry[1]}\n`;
    formattedContent += currentEntry.slice(2).join("\n") + "\n\n";
  }

  return formattedContent.trim();
}
