import { NextApiRequest, NextApiResponse } from "next";
import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const generateVoice = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const audio = await elevenlabs.generate({
      voice: "Rachel",
      text: "However, we can change this situation.",
      model_id: "eleven_turbo_v2_5",
    });

    res.setHeader("Content-Type", "audio/mpeg");

    res.status(200).send(audio);
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: err });
  }
};

export default generateVoice;
