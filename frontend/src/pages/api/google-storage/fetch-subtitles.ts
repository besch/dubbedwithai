import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import storage from "./google-storage-config";
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

function cleanSrtContent(srtContent: string): string {
  // Remove HTML tags
  let cleaned = srtContent.replace(/<[^>]*>/g, "");

  // Remove bracketed descriptions like [Phone ringing] or [Sigh]
  cleaned = cleaned.replace(/\[.*?\]/g, "");

  // Trim whitespace from each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove empty lines (keeping newlines for SRT format)
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, "");

  return cleaned;
}

const fetchSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  try {
    const bucketName = "dubbed_with_ai";
    const { movieId, subtitleId } = req.body;
    const filePath = `${movieId}/${subtitleId}/subtitles.srt`;

    const [fileExists] = await storage
      .bucket(bucketName)
      .file(filePath)
      .exists();

    if (!fileExists) {
      const baseUrl = process.env.API_URL;
      const getSubtitleLanguagesResponse = await fetch(
        `${baseUrl}/api/opensubtitles/get-subtitle-languages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`,
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
          details: responseText.substring(0, 200),
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
          details: responseText.substring(0, 200),
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

      // Fetch the subtitle content and save it to Google Storage
      const fetchSubtitlesResponse = await fetch(
        `${baseUrl}/api/opensubtitles/fetch-subtitles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //   Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileId }),
        }
      );

      if (!fetchSubtitlesResponse.ok) {
        return res.status(fetchSubtitlesResponse.status).json({
          error: "Error fetching subtitles",
        });
      }

      const { srtContent } = await fetchSubtitlesResponse.json();
      const cleanedSrtContent = cleanSrtContent(srtContent);
      await storage.bucket(bucketName).file(filePath).save(cleanedSrtContent);
    }

    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    res.setHeader("Content-Type", "application/x-subrip");
    return res.status(200).send(fileContents);
  } catch (err) {
    console.error("Error fetching subtitles:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitles;
