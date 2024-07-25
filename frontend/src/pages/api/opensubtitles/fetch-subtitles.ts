// pages/api/opensubtitles/fetch-subtitles.ts
import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";

const bucketName = "dubbed_with_ai";

export default async function fetchSubtitles(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, languageCode } = req.body;

  if (!imdbID || !languageCode) {
    return res
      .status(400)
      .json({ error: "Missing imdbID or languageCode parameter" });
  }

  try {
    // First, fetch the best subtitle
    const bestSubtitle = await getBestSubtitle(imdbID, languageCode);

    if (!bestSubtitle || !bestSubtitle.attributes.files[0].file_id) {
      return res.status(404).json({ error: "No suitable subtitle found" });
    }

    const fileId = bestSubtitle.attributes.files[0].file_id;
    const filePath = `${imdbID}/${languageCode}/subtitles.srt`;

    // Check if the file already exists in Google Storage
    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    let srtContent;
    if (fileExists) {
      // If file exists, download it from Google Storage
      const [fileContents] = await storage
        .bucket(bucketName)
        .file(filePath)
        .download();
      srtContent = fileContents.toString("utf-8");
    } else {
      // If file doesn't exist, download it from OpenSubtitles and save to Google Storage
      srtContent = await downloadAndSaveSubtitles(fileId, filePath);
    }

    res.status(200).json({
      subtitleInfo: bestSubtitle,
      srtContent: srtContent,
    });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getBestSubtitle(imdbID: string, languageCode: string) {
  const response = await fetch(
    `${process.env.API_URL}/api/opensubtitles/get-subtitle-languages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imdbID, languageCode }),
    }
  );

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

  // Save to Google Storage
  await storage.bucket(bucketName).file(filePath).save(srtContent);

  return srtContent;
}

async function fetchSubtitlesDownloadLink(fileId: string): Promise<string> {
  const response = await fetch(
    `https://api.opensubtitles.com/api/v1/download`,
    {
      method: "POST",
      headers: {
        "User-Agent": "ANYDUB v0.1",
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
