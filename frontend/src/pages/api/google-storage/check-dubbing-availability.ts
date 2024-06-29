import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { imdbID, subtitleId } = req.body;
  const bucketName = "dubbed_with_ai";
  const filePath = `${imdbID}/${subtitleId}/${subtitleId}.srt`;

  try {
    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (fileExists) {
      res.status(200).json({ dubbingPath: filePath });
    } else {
      res.status(404).json({ error: "Dubbing not found" });
    }
  } catch (error) {
    console.error("Error checking dubbing availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
