import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "../google-storage/google-storage-config";
import { DubbingVoice } from "@/types";
import { ElevenLabs, ElevenLabsClient } from "elevenlabs";

const bucketName = "dubbed_with_ai";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

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
    const buffer = await generateAndUploadAudio(text, filePath, voice);

    res.setHeader("Content-Type", "audio/mp3");
    res.status(200).send(buffer);
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
): Promise<Buffer> {
  const response = await elevenlabs.textToSpeech.convert(
    "pMsXgVXv3BLzUgSXRplE",
    {
      optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
      output_format: ElevenLabs.OutputFormat.Mp32205032,
      text,
      voice_settings: {
        stability: 0.1,
        similarity_boost: 0.3,
        style: 0.2,
      },
      // @ts-ignore
      language_code: "pl",
      model_id: "eleven_turbo_v2_5",
    }
  );

  const chunks: Uint8Array[] = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  if (!filePath.includes("uploaded")) {
    const file = storage.bucket(bucketName).file(filePath);
    await file.save(buffer, {
      metadata: {
        contentType: "audio/mpeg",
      },
    });
  }

  return buffer;
}
