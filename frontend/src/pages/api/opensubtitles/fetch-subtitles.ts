import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import OpenAI from "openai";
import languageCodes from "@/lib/languageCodes";

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

  if (!imdbID || !languageCode) {
    return res
      .status(400)
      .json({ error: "Missing imdbID or languageCode parameter" });
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

    // Step 2 & 3: Query OpenSubtitles or generate/translate if necessary
    const { subtitleInfo, srtContent, generated } =
      await getOrGenerateSubtitles(
        imdbID,
        languageCode,
        seasonNumber,
        episodeNumber
      );

    await storage.bucket(bucketName).file(filePath).save(srtContent);

    return res.status(200).json({
      subtitleInfo,
      srtContent,
      generated,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
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

  const fileId = bestSubtitle.attributes.files[0].file_id;
  let filePath: string;
  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    // TV series
    filePath = `${imdbID}/${seasonNumber}/${episodeNumber}/${targetLanguage}/subtitles.srt`;
  } else {
    // Movie
    filePath = `${imdbID}/${targetLanguage}/subtitles.srt`;
  }
  const rawSrtContent = await downloadSubtitles(fileId);

  // Translate subtitles to the target language
  const translatedContent = await translateSubtitles(
    rawSrtContent,
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

  // Priority languages
  const priorityLanguages = ["en", "es", "hi", "zh", "fr"];

  // Try to find a subtitle in priority languages
  for (const lang of priorityLanguages) {
    const prioritySubtitle = data.data.find(
      (subtitle: any) => subtitle.attributes.language === lang
    );
    if (prioritySubtitle) {
      return prioritySubtitle;
    }
  }

  // If no priority language subtitle is found, sort by download_count and return the best match
  return data.data.sort(
    (a: any, b: any) =>
      b.attributes.download_count - a.attributes.download_count
  )[0];
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
          content: `You are a professional translator. Translate the following SRT subtitle content from ${sourceLangName} to ${targetLangName}. Maintain the SRT format, including line numbers and timestamps. Ensure that there is always a new line before the next subtitle number.`,
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
