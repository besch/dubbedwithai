import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

export interface Subtitle {
  start: string;
  end: string;
  text: string;
}

function srtToObject(srtContent: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const lines = srtContent.split("\n");
  let subtitle: Partial<Subtitle> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!isNaN(Number(line))) {
      if (Object.keys(subtitle).length > 0) {
        subtitles.push(subtitle as Subtitle);
        subtitle = {};
      }
    } else if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((time) => time.trim());
      subtitle.start = start;
      subtitle.end = end;
    } else if (line !== "") {
      subtitle.text = (subtitle.text ? subtitle.text + " " : "") + line;
    }
  }

  if (Object.keys(subtitle).length > 0) {
    subtitles.push(subtitle as Subtitle);
  }

  return subtitles;
}

const fetchSubtitles = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  try {
    const response = await fetch(
      `https://api.opensubtitles.com/api/v1/download?imdb_id=${req.body.imdbID}&language=${req.body.language}`,
      {
        headers: {
          "User-Agent": "ANYDUB v0.1",
          "Api-Key": "StgOyEOSf17htjjIp7JrjDtK1DhT6tSC",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(srtToObject(data.srt_content));
  } catch (err) {
    console.error("Error fetching subtitle languages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default fetchSubtitles;
