import languageCodes from "@/lib/languageCodes";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translateSubtitles(
  srtContent: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const lines = srtContent.split("\n");
  const batches = [];
  const batchSize = 100;

  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize).join("\n"));
  }

  const translatedBatches = await Promise.all(
    batches.map((batch) =>
      translateBatch(batch, sourceLanguage, targetLanguage)
    )
  );

  return translatedBatches.join("\n");
}

export async function translateBatch(
  batch: string,
  sourceLanguage: string,
  targetLanguage: string,
  retries = 3
): Promise<string> {
  try {
    const sourceLangName = languageCodes[sourceLanguage] || sourceLanguage;
    const targetLangName = languageCodes[targetLanguage] || targetLanguage;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Translate the following subtitles from ${sourceLangName} to ${targetLangName}. 
            Maintain the exact same timing and numbering format. 
            Critical formatting rules:
            1. Each subtitle entry MUST be separated by exactly one empty line
            2. Each entry MUST follow this exact format (no square brackets):
               [number]
               [timestamp]
               [translated text]
               [empty line]
            3. The last subtitle entry MUST be followed by an empty line
            4. Never include multiple consecutive empty lines
            5. Preserve all original numbering and timing exactly as provided`,
        },
        { role: "user", content: batch },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying translation... Attempts left: ${retries - 1}`);
      return await translateBatch(
        batch,
        sourceLanguage,
        targetLanguage,
        retries - 1
      );
    }
    throw error;
  }
}

export function cleanSrtContent(srtContent: string): string {
  // Split the content into individual subtitle entries
  let entries = srtContent.split("\n\n");

  // Filter out entries that start with '#'
  entries = entries.filter((entry) => {
    const lines = entry.split("\n");
    return lines.length < 3 || !lines[2].trim().startsWith("#");
  });

  // Join the remaining entries back together
  let cleaned = entries.join("\n\n");

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

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

export function formatSubtitles(srtContent: string): string {
  const lines = srtContent.split("\n");
  let formattedContent = "";
  let currentEntry = [];
  let subtitleNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      if (currentEntry.length >= 3) {
        // Format and add the current entry
        formattedContent += `${subtitleNumber}\n`;
        formattedContent += `${currentEntry[1]}\n`;
        formattedContent += currentEntry.slice(2).join("\n") + "\n\n";
        subtitleNumber++;
      }
      currentEntry = [];
    } else {
      currentEntry.push(line);
    }
  }

  // Add the last entry if it exists
  if (currentEntry.length >= 3) {
    formattedContent += `${subtitleNumber}\n`;
    formattedContent += `${currentEntry[1]}\n`;
    formattedContent += currentEntry.slice(2).join("\n") + "\n\n";
  }

  return formattedContent.trim();
}

export function improveSubtitleFormatting(input: string): string {
  // Split the input into lines
  const lines = input.split("\n");
  let formattedSubtitles = [];
  let currentSubtitle = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if the line is a subtitle number
    if (/^\d+$/.test(line)) {
      // If we have a previous subtitle, add it to the formatted subtitles
      if (currentSubtitle.length > 0) {
        formattedSubtitles.push(currentSubtitle.join("\n"));
        currentSubtitle = [];
      }
      // Start a new subtitle
      currentSubtitle.push(line);
    }
    // Add non-empty lines to the current subtitle
    else if (line !== "") {
      currentSubtitle.push(line);
    }
  }

  // Add the last subtitle if there is one
  if (currentSubtitle.length > 0) {
    formattedSubtitles.push(currentSubtitle.join("\n"));
  }

  // Join all formatted subtitles with double line breaks
  return formattedSubtitles.join("\n\n");
}

const priorityLanguages = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ru",
  "ja",
  "zh",
  "ko",
];

// Priority release keywords
const priorityReleaseKeywords = [
  "bluray",
  "web-dl",
  "webdl",
  "webrip",
  "bdrip",
  "dvdrip",
  "hdrip",
];

export const calculateScore = (subtitle: any) => {
  let score = 0;
  const attrs = subtitle.attributes;

  // Prefer HD subtitles
  if (attrs.hd) score += 5;

  // Score based on download count (1 point per 100 downloads, max 10 points)
  score += Math.min(Math.floor(attrs.download_count / 100), 10);

  // Score based on rating (0-10 points)
  score += attrs.ratings * 2; // ratings are from 0-5, so we double it

  // Prefer more recent uploads (lose 1 point per month old, max 12 points lost)
  const monthsOld =
    (new Date().getTime() - new Date(attrs.upload_date).getTime()) /
    (1000 * 60 * 60 * 24 * 30);
  score -= Math.min(Math.floor(monthsOld), 12);

  // Prefer trusted uploaders
  if (attrs.from_trusted) score += 3;

  // Prefer certain languages
  const languageIndex = priorityLanguages.indexOf(attrs.language);
  if (languageIndex !== -1) {
    score += 5 - languageIndex; // 5 points for first language, 4 for second, etc.
  }

  // Prefer certain release types
  const release = attrs.release.toLowerCase();
  for (let i = 0; i < priorityReleaseKeywords.length; i++) {
    if (release.includes(priorityReleaseKeywords[i])) {
      score += 5 - i; // 5 points for first keyword, 4 for second, etc.
      break;
    }
  }

  return score;
};
