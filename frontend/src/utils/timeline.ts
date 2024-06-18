import { SubtitleType, FaceDataType } from "@/store/slices/subtitle";

export const convertToMilliseconds = (timeString: string): number => {
  const [hours, minutes, secondsMillis] = timeString.split(":");
  const seconds = secondsMillis.split(",")[0];
  const millis = secondsMillis.split(",")[1];
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(millis, 10)
  );
};

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toFixed(0)}:${seconds.toFixed(3)}`;
};

export const getFaceImage = (
  subtitle: SubtitleType,
  faceData: FaceDataType
): string | null => {
  if (!faceData) return null;

  const foundFace = faceData.data.find((face) => {
    const subtitleStartMs = subtitle.startMs;
    const subtitleEndMs = subtitle.endMs;

    if (
      subtitleStartMs <= face.subtitle_time_ms &&
      face.subtitle_time_ms <= subtitleEndMs
    ) {
      return true;
    }

    return false;
  });

  if (foundFace) {
    return faceData.encoded_images[foundFace.group_image_encoded_ref];
  }

  return null;
};
