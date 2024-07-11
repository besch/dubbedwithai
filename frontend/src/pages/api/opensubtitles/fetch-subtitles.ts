import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

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
    const downloadLink = await fetchSubtitles(fileId);
    const srtContent = await downloadSrtContent(downloadLink);
    res.status(200).json({ srtContent });
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function downloadSrtContent(link: string): Promise<string> {
  const response = await fetch(link);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

async function fetchSubtitles(fileId: string): Promise<string> {
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
