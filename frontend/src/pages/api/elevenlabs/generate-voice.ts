"use server";
import { NextApiRequest, NextApiResponse } from "next";
import { ElevenLabsClient, play } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: "75ec36a5f994d629537521b581d7958f",
});

export const generateVoice = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const audio = await elevenlabs.generate({
      voice: "Rachel",
      text: "Hello! 你好! Hola! नमस्ते! Bonjour! こんにちは! مرحبا! 안녕하세요! Ciao! Cześć! Привіт! வணக்கம்!",
      model_id: "eleven_multilingual_v2",
    });
    res.status(200).json({ audioFileUrl: audio });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: err });
  }
};

export const getAvailableVoices = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const voices = await elevenlabs.voices.getAll();
    res.status(200).json({ voices });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: err });
  }
};
