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
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${padZero(minutes)}:${padZero(seconds)}`;
};

const padZero = (num: number): string => {
  return num.toString().padStart(2, "0");
};
