export type DubbingVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

// Add this new type for Azure voices
export type AzureVoice =
  | "en-US-JennyNeural"
  | "en-US-GuyNeural"
  | "en-US-AmberNeural"
  | "en-US-ChristopherNeural"
  | "en-US-AriaNeural"
  | "en-US-JaneNeural";

export interface AdjustedTiming {
  start: number;
  end: number;
}

export interface Language {
  id: string;
  attributes: {
    language: string;
    language_name: string;
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
