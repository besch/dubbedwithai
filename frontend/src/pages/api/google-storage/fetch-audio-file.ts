import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "./google-storage-config";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";

const fetchAudioFile = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const { filePath, url } = req.body;
  const startTime = new Date();
  const logEntry: LogEntry = {
    endpoint: "/api/google-storage/fetch-audio-file",
    parameters: { filePath },
    ip_address:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "",
    timestamp: startTime.toISOString(),
    success: false,
    steps: {},
    url,
  };

  try {
    const bucketName = "dubbed_with_ai";

    if (!filePath) {
      logEntry.error_message = "File path is required";
      logEntry.error_code = "400";
      await logApiRequest(logEntry);
      return res.status(400).json({ error: "File path is required" });
    }

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      logEntry.error_message = `File not found: ${filePath}`;
      logEntry.error_code = "404";
      await logApiRequest(logEntry);
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    logEntry.success = true;
    logEntry.steps = {
      fileChecked: true,
      fileDownloaded: true,
    };
    await logApiRequest(logEntry);

    res.setHeader("Content-Type", "audio/mp3");
    return res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching audio file:", err);
    logEntry.error_message = "Internal Server Error";
    logEntry.error_code = "500";
    await logApiRequest(logEntry);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchAudioFile;
