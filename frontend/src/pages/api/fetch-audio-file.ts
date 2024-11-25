import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "@/lib/google-storage-config";

const fetchAudioFile = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const { filePath } = req.body;

  try {
    const bucketName = "dubbed_with_ai";

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    res.setHeader("Content-Type", "audio/mp3");
    return res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching audio file:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchAudioFile;
