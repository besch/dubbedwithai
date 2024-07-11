import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "./google-storage-config";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const fetchAudioFile = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  // Check for authentication token
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the token
    let userId: string | undefined;

    // Try to verify as ID token first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      userId = payload?.sub;
    } catch (idTokenError) {
      // If ID token verification fails, try to verify as access token
      try {
        const userInfo = await client.getTokenInfo(token);
        userId = userInfo.sub;
      } catch (accessTokenError) {
        console.error("Token verification failed:", accessTokenError);
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Token is valid, proceed with fetching the audio file
    const bucketName = "dubbed_with_ai";
    const { movieId, subtitleId, fileName } = req.body;
    const filePath = `${movieId}/${subtitleId}/${fileName}`;

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    // Set the appropriate content type for the audio file
    res.setHeader("Content-Type", "audio/mp3");

    // Send the audio file contents as the response
    return res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching audio file:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchAudioFile;
