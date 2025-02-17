import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "@/lib/google-storage-config";
import OpenAI from "openai";
import { DubbingVoice } from "@/types";
import { logApiRequest, LogEntry } from "@/lib/logApiRequest";
import { checkUsageLimit } from "@/lib/checkUsageLimit";
import { checkRateLimit } from '@/middleware/rateLimiting';
import supabase from '@/lib/supabaseClient';
import { fetchPlanLimits } from '@/lib/planLimits';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const bucketName = "dubbed_with_ai";
const UPGRADE_URL = 'https://www.dubabase.com/';

export default async function generateAudio(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const { url, text, filePath } = req.body;
  const ip_address =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "";
  const startTime = new Date();
  const logEntry: LogEntry = {
    endpoint: "/api/generate-audio",
    parameters: { text, filePath },
    ip_address,
    timestamp: startTime.toISOString(),
    success: false,
    steps: {},
    url: url,
  };

  if (!text || !filePath) {
    console.error("Missing required parameters:", { text, filePath });
    logEntry.error_message = "Missing required parameters";
    logEntry.error_code = "400";
    await logApiRequest(logEntry);
    return res.status(400).json({
      error: "Missing required parameters",
      details: {
        text: text ? "provided" : "missing",
        filePath: filePath ? "provided" : "missing",
      },
    });
  }

  if (text.length > 250) {
    return res.status(400).json({
      error: "Text too long",
      details: `Text length (${text.length}) exceeds maximum length of 250 characters`,
    });
  }

  try {
    // Check usage limit first
    const { hasExceededLimit, currentCount, resetAt } = await checkUsageLimit(ip_address);
    console.error('Usage limit check:', { hasExceededLimit, currentCount });
    
    if (hasExceededLimit) {
      const { data: freePlan } = await supabase
        .from('plan_limits')
        .select('request_limit')
        .eq('name', 'FREE')
        .single();

      return res.status(429).json({
        error: "Free tier limit exceeded",
        details: {
          currentCount,
          limit: freePlan?.request_limit,
          resetAt,
          requiresSubscription: true,
          message: `You've reached your free tier limit of ${freePlan?.request_limit} requests. Your limit will reset on ${new Date(resetAt).toLocaleDateString()}.`,
          upgradeUrl: UPGRADE_URL,
          upgradeMessage: "Upgrade to a premium plan to continue using OneDub without limits!"
        },
      });
    }

    // Continue with audio generation only if limit not exceeded
    await checkRateLimit(req, res, async () => {
      const planLimits = await fetchPlanLimits();

      const voice = extractVoiceFromFilePath(filePath);
      const buffer = await generateAndUploadAudio(text, filePath, voice);

      logEntry.success = true;
      logEntry.steps = {
        voiceExtracted: true,
        audioGenerated: true,
        audioUploaded: true,
      };
      await logApiRequest(logEntry);

      res.setHeader("Content-Type", "audio/mp3");
      res.status(200).send(buffer);

      // Log the request
      await supabase.from('api_logs').insert({
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        endpoint: '/api/generate-audio',
        parameters: req.body,
        success: true
      });
    });
  } catch (error: unknown) {
    console.error("Error generating audio:", error);
    logEntry.error_message =
      error instanceof Error ? error.message : "An unknown error occurred";
    logEntry.error_code = "500";
    await logApiRequest(logEntry);
    await supabase.from('api_logs').insert({
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      endpoint: '/api/generate-audio',
      parameters: req.body,
      success: false,
      error_message: error instanceof Error ? error.message : "An unknown error occurred"
    });
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
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice,
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  if (!filePath.includes("uploaded")) {
    const file = storage.bucket(bucketName).file(filePath);
    await file.save(buffer, {
      metadata: {
        contentType: "audio/mp3",
      },
    });
  }

  return buffer;
}
