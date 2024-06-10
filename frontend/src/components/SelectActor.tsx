import {
  setFaceData,
  FaceDataType,
  SubtitleType,
  setSubtitles,
} from "@/store/slices/subtitle";
import React, { Suspense, lazy, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import Image from "next/image";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FixedSizeList, ListChildComponentProps } from "react-window";

const LazyLoadedImage = lazy(() => import("next/image"));

interface LazyImageProps {
  src: string;
  width: number;
  height: number;
  [key: string]: any;
}

const LazyImage = ({ src, width, height, ...props }: LazyImageProps) => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyLoadedImage
      src={src}
      width={width}
      height={height}
      {...props}
      alt=""
    />
  </Suspense>
);

const SelectActor = ({ subtitleIndex }: { subtitleIndex: string }) => {
  const dispatch = useDispatch();
  const { faceData, subtitles } = useSelector(
    (state: RootState) => state.subtitle
  );

  const handleSelect = (newFace: string) => {
    const cloneSubtitles = subtitles.map((subtitle, index) => {
      if (index === parseInt(subtitleIndex) - 1) {
        return {
          ...subtitle,
          image: faceData.encoded_images[newFace],
        };
      }
      return subtitle;
    });
    dispatch(setSubtitles(cloneSubtitles));
  };

  return (
    <div className="my-4 w-[300px]">
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="h-[100px]">
          <SelectValue placeholder="Select Actor" />
        </SelectTrigger>
        <SelectContent position="popper">
          {Object.entries(faceData.encoded_images).map(
            ([key, image], index) => (
              <div
                className="flex flex-row items-center cursor-pointer"
                key={index}
              >
                <SelectItem value={key}>
                  <div className="flex items-center cursor-pointer w-full">
                    <LazyImage
                      className=""
                      src={`data:image/png;base64,${image}`}
                      width={60}
                      height={60}
                    />
                    <div className="ml-6">{key}</div>
                  </div>
                </SelectItem>
              </div>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectActor;
