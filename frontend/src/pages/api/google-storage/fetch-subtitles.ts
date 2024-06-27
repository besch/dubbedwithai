import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const fetchSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  const { movieId, language } = req.body;

  // Define the bucket name and file path
  const bucketName = "dubbed_with_ai";
  const filePath = `${movieId}/${language}/subtitles.srt`;
  console.log("filePath", filePath);

  try {
    const file = storage.bucket(bucketName).file(filePath);

    // Download the file
    const [contents] = await file.download();

    // Send the file contents as the response

    res.status(200).json(contents.toString());
  } catch (err) {
    console.error("Error fetching subtitle languages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitles;
