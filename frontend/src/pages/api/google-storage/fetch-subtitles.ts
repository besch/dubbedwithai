import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "./google-storage-config";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

// At the top of your file, make sure you have this interface defined:
interface Language {
  id: string;
  attributes: {
    language: string;
    ratings: number;
    download_count: number;
    subtitle_id: string;
    files: Array<{
      file_id: string;
      format: string;
      download_count: number;
    }>;
  };
}

const fetchSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
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
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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

    // Token is valid, proceed with fetching the subtitles
    const bucketName = "dubbed_with_ai";
    const { movieId, subtitleId } = req.body;
    const filePath = `${movieId}/${subtitleId}/subtitles.srt`;

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      // File not found, get subtitle languages and find the correct fileId
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log("!!!!!!!!!!!!", baseUrl);
      const getSubtitleLanguagesResponse = await fetch(
        `${baseUrl}/api/opensubtitles/get-subtitle-languages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imdbID: movieId }),
        }
      );

      if (!getSubtitleLanguagesResponse.ok) {
        const responseText = await getSubtitleLanguagesResponse.text();
        console.error(
          "Error response from get-subtitle-languages:",
          responseText
        );
        return res.status(getSubtitleLanguagesResponse.status).json({
          error: "Error fetching subtitle languages",
          details: responseText.substring(0, 200), // Include the first 200 characters of the response
        });
      }

      let subtitleLanguages;
      try {
        subtitleLanguages = await getSubtitleLanguagesResponse.json();
      } catch (error) {
        console.error("Error parsing JSON from get-subtitle-languages:", error);
        const responseText = await getSubtitleLanguagesResponse.text();
        return res.status(500).json({
          error: "Error parsing subtitle languages response",
          details: responseText.substring(0, 200), // Include the first 200 characters of the response
        });
      }
      const selectedLanguage = subtitleLanguages.data.find(
        (lang: Language) => lang.attributes.subtitle_id === subtitleId
      );

      if (!selectedLanguage) {
        return res.status(404).json({
          error: `Language ${subtitleId} not found for movie ${movieId}`,
        });
      }

      const fileId = selectedLanguage.attributes.files[0]?.file_id;

      if (!fileId) {
        return res.status(404).json({
          error: `No file found for language ${subtitleId} and movie ${movieId}`,
        });
      }

      // Trigger generate-dub
      const generateDubResponse = await fetch(`${baseUrl}/api/generate-dub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imdbID: movieId,
          subtitleID: subtitleId,
          fileId,
        }),
      });

      console.log("generateDubResponse", generateDubResponse);

      if (!generateDubResponse.ok) {
        const errorData = await generateDubResponse.json();
        return res.status(generateDubResponse.status).json(errorData);
      }

      // After generate-dub is complete, try to fetch the file again
      const [newFileExists] = await storage
        .bucket(bucketName)
        .file(filePath)
        .exists();

      if (!newFileExists) {
        return res
          .status(404)
          .json({ error: `File not found after generation: ${filePath}` });
      }
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    // Set the appropriate content type for the subtitle file
    res.setHeader("Content-Type", "application/x-subrip");

    // Send the subtitle file contents as the response
    return res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching subtitles:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitles;
