import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { Storage } from "@google-cloud/storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});
const storage = new Storage();
const bucketName = "dubbed_with_ai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { text, fileName } = req.body;

  if (!text || !fileName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    await generateAndUploadAudio(text, fileName);
    res
      .status(200)
      .json({ message: "Audio generated and uploaded successfully" });
  } catch (error) {
    console.error("Error generating audio:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function generateAndUploadAudio(
  text: string,
  fileName: string
): Promise<void> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "echo",
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  const file = storage.bucket(bucketName).file(fileName);
  await file.save(buffer, {
    metadata: {
      contentType: "audio/mpeg",
    },
  });
}
