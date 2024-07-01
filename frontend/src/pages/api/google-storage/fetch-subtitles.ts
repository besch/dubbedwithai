import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const fetchSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  try {
    const bucketName = "dubbed_with_ai";
    const { movieId, subtitleId } = req.body;
    const filePath = `${movieId}/${subtitleId}/subtitles.srt`;

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    // Set the appropriate content type for the audio file
    res.setHeader("Content-Type", "application/x-subrip");

    // Send the audio file contents as the response
    res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching audio file:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitles;
