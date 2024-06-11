import { setFaceData } from "@/store/slices/subtitle";
import { setCanvasImage } from "@/store/slices/video";
import { RootState } from "@/store/store";
import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

interface RectDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ActorImageCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCanvasActive: boolean;
}

const ActorImageCapture: React.FC<ActorImageCaptureProps> = ({
  videoRef,
  isCanvasActive,
}) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rectDimensions, setRectDimensions] = useState<RectDimensions>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);

  const captureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = rectDimensions.width;
    croppedCanvas.height = rectDimensions.height;
    const ctx = croppedCanvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        canvas,
        rectDimensions.x,
        rectDimensions.y,
        rectDimensions.width,
        rectDimensions.height,
        0,
        0,
        rectDimensions.width,
        rectDimensions.height
      );
      const capturedImageData = croppedCanvas
        .toDataURL("image/png")
        .split("data:image/png;base64,")[1];
      dispatch(setCanvasImage(capturedImageData));

      setFaceData;
      setRectDimensions({ x: 0, y: 0, width: 0, height: 0 }); // Reset rectangle dimensions
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;

      const renderFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw the rectangle after drawing the video frame
        if (isDrawing) {
          ctx.strokeStyle = "green";
          ctx.lineWidth = 3;
          ctx.strokeRect(
            rectDimensions.x,
            rectDimensions.y,
            rectDimensions.width,
            rectDimensions.height
          );
        }

        requestAnimationFrame(renderFrame); // Call renderFrame recursively
      };

      const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        setStartX(e.clientX - rect.left);
        setStartY(e.clientY - rect.top);
        setRectDimensions({ x: startX, y: startY, width: 0, height: 0 });
        setIsDrawing(true);
      };

      const handleMouseMove = (e: MouseEvent) => {
        console.log("move", isDrawing);
        if (isDrawing) {
          const rect = canvas.getBoundingClientRect();
          const width = e.clientX - rect.left - startX;
          const height = e.clientY - rect.top - startY;
          //   console.log(width, height);
          setRectDimensions({
            x: startX,
            y: startY,
            width: Math.abs(width),
            height: Math.abs(height),
          });
        }
      };

      const handleMouseUp = () => {
        setIsDrawing(false);
        captureImage(); // Call captureImage when the user releases the mouse button
      };

      // Call renderFrame initially to start the animation loop
      renderFrame();

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [videoRef, isDrawing, rectDimensions]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{
          cursor: "crosshair",
          display: isCanvasActive ? "block" : "none",
        }}
      />
    </div>
  );
};

export default ActorImageCapture;
