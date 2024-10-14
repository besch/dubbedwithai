import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function recognizeSpeech(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("recognizeSpeech");
  const { audioData, languageCode } = req.body;

  if (!audioData || !languageCode) {
    return res
      .status(400)
      .json({ error: "Audio data and language code are required" });
  }

  try {
    // Create a temporary file to store the audio data
    const tempFilePath = path.join("/tmp", `audio_${Date.now()}.mp3`);
    const buffer = Buffer.from(audioData, "base64");
    fs.writeFileSync(tempFilePath, buffer);

    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
    });

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    const originalTranscript = transcriptionResponse.text;
    console.log("Original transcript:", originalTranscript);

    // Translate the transcript to the target language
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text to ${languageCode}.`,
        },
        { role: "user", content: originalTranscript },
      ],
    });

    const translatedTranscript = translationResponse.choices[0].message.content;
    console.log("Translated transcript:", translatedTranscript);

    return res.status(200).json({
      success: true,
      originalTranscript,
      translatedTranscript,
    });
  } catch (error: any) {
    console.error("Error during speech recognition or translation:", error);
    return res.status(500).json({
      error: "Speech recognition or translation failed",
      details: error.message,
      stack: error.stack,
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
