import {
  setSubtitles,
  getSelectedSubtitle,
  getImageByActorName,
} from "@/store/slices/subtitle";
import React, { Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const SelectActor = () => {
  const dispatch = useDispatch();
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const { faceData, subtitles } = subtitleState;
  const selectedSubtitle = getSelectedSubtitle(subtitleState);
  const getActorImage = getImageByActorName(subtitleState);

  const handleSelect = (newFace: string) => {
    const cloneSubtitles = subtitles.map((subtitle, index) => {
      if (selectedSubtitle && index === selectedSubtitle.index) {
        return {
          ...subtitle,
          actorName: newFace,
        };
      }
      return subtitle;
    });
    dispatch(setSubtitles(cloneSubtitles));
  };

  return (
    <div className="my-4 w-[300px]">
      <Select
        onValueChange={handleSelect}
        value={
          !selectedSubtitle || !selectedSubtitle.actorName
            ? undefined
            : selectedSubtitle.actorName
        }
      >
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
