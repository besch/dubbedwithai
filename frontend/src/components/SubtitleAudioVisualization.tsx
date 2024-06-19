import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface SubtitleAudioVisualizationProps {
  videoUrl: string;
  startTime: number;
  endTime: number;
}

const SubtitleAudioVisualization: React.FC<SubtitleAudioVisualizationProps> = ({
  //   videoUrl,
  startTime,
  endTime,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      if (waveformRef.current) {
        const waveSurfer = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: "violet",
          progressColor: "purple",
          plugins: [
            RegionPlugin.create({
              regions: [
                {
                  start: startTime,
                  end: endTime,
                  color: "rgba(255, 0, 0, 0.1)",
                },
              ],
            }),
          ],
        });

        waveSurferRef.current = waveSurfer;

        const videoBlob = await fetch(videoUrl).then((res) => res.blob());
        const videoObjectUrl = URL.createObjectURL(videoUrl);

        waveSurfer.load(videoObjectUrl);
        waveSurfer.setWaveViewRegion(startTime, endTime);
      }
    };

    loadAudio();

    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
    };
  }, [videoUrl, startTime, endTime]);

  return <div ref={waveformRef} />;
};

export default SubtitleAudioVisualization;
