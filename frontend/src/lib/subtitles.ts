import OpenAI from "openai";
import languageCodes from "@/lib/languageCodes";

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
          content: `You are a professional subtitle translator. Translate the following SRT subtitle content from ${sourceLangName} to ${targetLangName}. Strictly adhere to these SRT formatting rules:
            1. Each subtitle entry consists of four parts:
              a) A sequential number
              b) The timecode line with start and end times (--:--:--,--- --> --:--:--,---)
              c) The subtitle text (one or many lines).
              d) A blank line to separate entries

            2. Maintain the exact timecodes from the original subtitles.

            3. Translate only the subtitle text. Do not alter numbers or timecodes.

            4. Keep line breaks within the subtitle text as in the original.

            5. Ensure there's always a blank line between subtitle entries.

            6. Remove any formatting tags like <i> for italics if present.

            7. If subtitle text is empty or translated text is empty or corrupted somehow, do not include this subtitle

            Example of correct formatting:

            "1
            00:00:42,625 --> 00:00:44,793
            Translated text line 1
            Translated text line 2

            2
            00:00:47,797 --> 00:00:48,923
            Short translated line

            3
            00:00:49,173 --> 00:00:52,593
            Italicized translated text
            Italicized translated text
            Italicized translated text
            Italicized translated text"

            Translate accurately while maintaining natural language flow in ${targetLangName}.`,
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
