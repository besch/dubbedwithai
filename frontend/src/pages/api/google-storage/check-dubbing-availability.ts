import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const checkDubbingAvailability = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { imdbID, language } = req.body;
  await runMiddleware(req, res, cors);
  const bucketName = "dubbed_with_ai";
  const folderName = `${imdbID}/${language}/`;

  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: folderName,
      delimiter: "/",
      maxResults: 1,
    });

    if (files.length > 0) {
      console.log(`Folder ${folderName} exists in bucket ${bucketName}.`);
      res.status(200).json({ exists: true });
    } else {
      console.log(
        `Folder ${folderName} does not exist in bucket ${bucketName}.`
      );
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking if folder exists:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default checkDubbingAvailability;
