import { NextApiRequest, NextApiResponse } from "next";
import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: "75ec36a5f994d629537521b581d7958f",
});

const generateVoice = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const audio = await elevenlabs.generate({
      voice: "Rachel",
      text: "However, we can change this situation.",
      model_id: "eleven_multilingual_v2",
    });

    // Set the appropriate headers for the audio file
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="generated_audio.mp3"'
    );

    // Send the audio data as the response body
    res.status(200).send(audio);
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: err });
  }
};

export default generateVoice;
