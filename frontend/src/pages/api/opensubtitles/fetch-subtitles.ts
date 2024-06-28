import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import srtToObject from "@/lib/srtParser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId parameter" });
  }

  try {
    const subtitles = await fetchSubtitles(fileId);
    const parsedSubtitles = srtToObject(subtitles);
    res.status(200).json(parsedSubtitles);
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function fetchSubtitles(fileId: string): Promise<string> {
  const response = await fetch(
    `https://api.opensubtitles.com/api/v1/download`,
    {
      method: "POST",
      headers: {
        "User-Agent": "ANYDUB v0.1",
        "Api-Key": "StgOyEOSf17htjjIp7JrjDtK1DhT6tSC",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.srt_content;
}
