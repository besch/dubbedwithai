import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "@/lib/google-storage-config";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import OpenAI from "openai";
import { DubbingVoice } from "@/types";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const bucketName = "dubbed_with_ai";

function extractVoiceFromFilePath(filePath: string): DubbingVoice {
  const parts = filePath.split("/");
  const voice = parts[parts.length - 2] as DubbingVoice;
  const validVoices = [
    "en-US-JennyNeural",
    "en-US-GuyNeural",
    "en-US-AmberNeural",
    "en-US-ChristopherNeural",
    "en-US-AriaNeural",
    "en-US-JaneNeural",
    "es-ES-ElviraNeural",
    "es-ES-AlvaroNeural",
    "fr-FR-DeniseNeural",
    "fr-FR-HenriNeural",
    "de-DE-KatjaNeural",
    "de-DE-ConradNeural",
    "it-IT-ElsaNeural",
    "it-IT-DiegoNeural",
    "ja-JP-NanamiNeural",
    "ja-JP-KeitaNeural",
    "ko-KR-SunHiNeural",
    "ko-KR-InJoonNeural",
    "pt-BR-FranciscaNeural",
    "pt-BR-AntonioNeural",
    "ru-RU-SvetlanaNeural",
    "ru-RU-DmitryNeural",
    "zh-CN-XiaoxiaoNeural",
    "zh-CN-YunxiNeural",
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
  ];
  if (!validVoices.includes(voice)) {
    throw new Error(`Invalid voice: ${voice}`);
  }
  return voice;
}

export default async function generateAudio(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { url, text, filePath } = req.body;

  const singleLineText = text.replace(/\n/g, " ");

  const startTime = new Date();
  const logEntry: LogEntry = {
    endpoint: "/api/openai/generate-audio",
    parameters: { text: singleLineText, filePath },
    ip_address:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "",
    timestamp: startTime.toISOString(),
    success: false,
    steps: {},
    url: url,
  };

  if (!singleLineText || !filePath) {
    console.error("Missing required parameters:", { text, filePath });
    logEntry.error_message = "Missing required parameters";
    logEntry.error_code = "400";
    await logApiRequest(logEntry);
    return res.status(400).json({
      error: "Missing required parameters",
      details: {
        text: singleLineText ? "provided" : "missing",
        filePath: filePath ? "provided" : "missing",
      },
    });
  }

  try {
    const voice = extractVoiceFromFilePath(filePath);
    const buffer = await generateAndUploadAudio(
      singleLineText,
      filePath,
      voice
    );

    logEntry.success = true;
    logEntry.steps = {
      voiceExtracted: true,
      audioGenerated: true,
      audioUploaded: true,
    };
    await logApiRequest(logEntry);

    res.setHeader("Content-Type", "audio/mp3");
    res.status(200).send(buffer);
  } catch (error: unknown) {
    console.error("Error generating audio:", error);
    logEntry.error_message =
      error instanceof Error ? error.message : "An unknown error occurred";
    logEntry.error_code = "500";
    await logApiRequest(logEntry);
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

async function generateAndUploadAudio(
  text: string,
  filePath: string,
  voice: DubbingVoice
): Promise<Buffer> {
  let buffer: Buffer;

  if (["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(voice)) {
    // Use OpenAI for old voices
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
    });
    buffer = Buffer.from(await mp3.arrayBuffer());
  } else {
    // Use Azure for new voices
    buffer = await generateAzureAudio(text, voice, filePath);
  }

  if (!filePath.includes("uploaded")) {
    const file = storage.bucket(bucketName).file(filePath);
    await file.save(buffer, { metadata: { contentType: "audio/mp3" } });
  }

  return buffer;
}

async function generateAzureAudio(
  text: string,
  voice: DubbingVoice,
  filePath: string
): Promise<Buffer> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY!,
    process.env.AZURE_SPEECH_REGION!
  );
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">
      <voice name="${speechConfig.speechSynthesisVoiceName}">
        <prosody rate="1.2">
          <break strength="x-weak" />
          ${text}
        </prosody>
      </voice>
    </speak>
  `;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  return new Promise((resolve, reject) => {
    let isSynthesisComplete = false;

    synthesizer.synthesisStarted = () => {};

    synthesizer.synthesisCompleted = () => {
      isSynthesisComplete = true;
    };

    synthesizer.SynthesisCanceled = (s, e) => {};

    synthesizer.speakSsmlAsync(
      ssml,
      async (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const buffer = Buffer.from(result.audioData);

          if (!filePath.includes("uploaded")) {
            const file = storage.bucket(bucketName).file(filePath);
            await file.save(buffer, { metadata: { contentType: "audio/mp3" } });
          }

          synthesizer.close();
          resolve(buffer);
        } else {
          synthesizer.close();
          reject(
            new Error(
              `Speech synthesis failed. Reason: ${
                sdk.ResultReason[result.reason]
              }`
            )
          );
        }
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );

    setTimeout(() => {
      if (!isSynthesisComplete) {
        synthesizer.close();
        reject(new Error("Speech synthesis timed out"));
      }
    }, 30000);
  });
}
