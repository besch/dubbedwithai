import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import OpenAI from "openai";
import { DubbingVoice } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const bucketName = "dubbed_with_ai";

export default async function generateAudio(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { text, filePath } = req.body;

  if (!text || !filePath) {
    console.error("Missing required parameters:", { text, filePath });
    return res.status(400).json({
      error: "Missing required parameters",
      details: {
        text: text ? "provided" : "missing",
        filePath: filePath ? "provided" : "missing",
      },
    });
  }

  try {
    const voice = extractVoiceFromFilePath(filePath);
    await generateAndUploadAudio(text, filePath, voice);
    res
      .status(200)
      .json({ message: "Audio generated and uploaded successfully" });
  } catch (error: unknown) {
    console.error("Error generating audio:", error);
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        details: "An unknown error occurred",
      });
    }
  }
}

function extractVoiceFromFilePath(filePath: string): DubbingVoice {
  const parts = filePath.split("/");
  const voice = parts[parts.length - 2] as DubbingVoice;
  if (!["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(voice)) {
    throw new Error(`Invalid voice: ${voice}`);
  }
  return voice;
}

async function generateAndUploadAudio(
  text: string,
  filePath: string,
  voice: DubbingVoice
): Promise<void> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice,
    input: text,
  });
  console.log("voice", voice);

  const buffer = Buffer.from(await mp3.arrayBuffer());

  const file = storage.bucket(bucketName).file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType: "audio/mpeg",
    },
  });
}
