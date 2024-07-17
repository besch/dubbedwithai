import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "./google-storage-config";

export default async function checkFileExists(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "Missing filePath parameter" });
  }

  const bucketName = "dubbed_with_ai";

  try {
    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    console.log("File exists:", fileExists);

    res.status(200).json({ exists: fileExists });
  } catch (error) {
    console.error("Error checking file existence:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
