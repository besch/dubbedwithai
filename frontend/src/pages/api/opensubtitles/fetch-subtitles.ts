import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import OpenAI from "openai";

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
      filePath = `${imdbID}/${languageCode}/${seasonNumber}/${episodeNumber}/subtitles.srt`;
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
            language_name: languageCode,
          },
        },
        srtContent: srtContent,
      });
    }

    // Step 2: Query OpenSubtitles if not in Google Storage
    const bestSubtitle = await getBestSubtitle(
      imdbID,
      languageCode,
      seasonNumber,
      episodeNumber
    );

    if (bestSubtitle && bestSubtitle.attributes.files[0].file_id) {
      const fileId = bestSubtitle.attributes.files[0].file_id;
      const srtContent = await downloadAndSaveSubtitles(fileId, filePath);
      return res.status(200).json({
        subtitleInfo: bestSubtitle,
        srtContent: srtContent,
        generated: false,
      });
    }

    // Step 3: Generate new subtitles if not found in OpenSubtitles
    const generatedSrtContent = await generateSubtitles(imdbID, languageCode);
    await storage.bucket(bucketName).file(filePath).save(generatedSrtContent);

    return res.status(200).json({
      subtitleInfo: {
        attributes: {
          language: languageCode,
          language_name: languageCode,
        },
      },
      srtContent: generatedSrtContent,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getBestSubtitle(
  imdbID: string,
  languageCode: string,
  seasonNumber?: number,
  episodeNumber?: number
) {
  let url = `${process.env.API_URL}/api/opensubtitles/get-subtitle-languages`;

  const body: any = { imdbID, languageCode };

  if (seasonNumber !== undefined && episodeNumber !== undefined) {
    body.parent_imdb_id = imdbID;
    body.season_number = seasonNumber;
    body.episode_number = episodeNumber;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

async function downloadAndSaveSubtitles(
  fileId: string,
  filePath: string
): Promise<string> {
  const downloadLink = await fetchSubtitlesDownloadLink(fileId);
  const srtContent = await downloadSrtContent(downloadLink);
  const strContentClean = cleanSrtContent(srtContent);

  // Save to Google Storage
  await storage.bucket(bucketName).file(filePath).save(strContentClean);

  return strContentClean;
}

async function generateSubtitles(
  movieId: string,
  targetLanguage: string
): Promise<string> {
  // Fetch English subtitles
  const englishSubtitles = await getBestSubtitle(movieId, "en");
  if (!englishSubtitles || !englishSubtitles.attributes.files[0].file_id) {
    throw new Error("No English subtitles found to translate from");
  }

  const fileId = englishSubtitles.attributes.files[0].file_id;
  const rawSrtContent = await downloadAndSaveSubtitles(fileId, "temp.srt");
  const cleanedSrtContent = cleanSrtContent(rawSrtContent);

  // Translate subtitles
  return await translateSubtitles(cleanedSrtContent, targetLanguage);
}

async function translateSubtitles(
  srtContent: string,
  targetLanguage: string
): Promise<string> {
  const lines = srtContent.split("\n");
  const batches = [];
  const batchSize = 100;

  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize).join("\n"));
  }

  const translatedBatches = await Promise.all(
    batches.map((batch) => translateBatch(batch, targetLanguage))
  );

  return translatedBatches.join("\n");
}

async function translateBatch(
  batch: string,
  targetLanguage: string,
  retries = 3
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following SRT subtitle content from English to ${targetLanguage}. Maintain the SRT format, including line numbers and timestamps. Ensure that there is always a new line before the next subtitle number.`,
        },
        { role: "user", content: batch },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying translation... Attempts left: ${retries - 1}`);
      return await translateBatch(batch, targetLanguage, retries - 1);
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
