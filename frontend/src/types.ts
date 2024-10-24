export type DubbingVoice =
  | "en-US-JennyNeural"
  | "en-US-GuyNeural"
  | "en-US-AmberNeural"
  | "en-US-ChristopherNeural"
  | "en-US-AriaNeural"
  | "en-US-JaneNeural"
  | "es-ES-ElviraNeural"
  | "es-ES-AlvaroNeural"
  | "fr-FR-DeniseNeural"
  | "fr-FR-HenriNeural"
  | "de-DE-KatjaNeural"
  | "de-DE-ConradNeural"
  | "it-IT-ElsaNeural"
  | "it-IT-DiegoNeural"
  | "ja-JP-NanamiNeural"
  | "ja-JP-KeitaNeural"
  | "ko-KR-SunHiNeural"
  | "ko-KR-InJoonNeural"
  | "pt-BR-FranciscaNeural"
  | "pt-BR-AntonioNeural"
  | "ru-RU-SvetlanaNeural"
  | "ru-RU-DmitryNeural"
  | "zh-CN-XiaoxiaoNeural"
  | "zh-CN-YunxiNeural";

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
