import { setFaceData, FaceDataType } from "@/store/slices/subtitle";
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

interface MemoizedSelectItemProps {
  imageKey: string;
  value: string;
  className?: string;
}

const MemoizedSelectItem = memo(
  ({ imageKey, value, className }: MemoizedSelectItemProps) => (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectItem value={imageKey} className={className}>
        <LazyImage
          className="h-60px w-60px p-2"
          src={`data:image/png;base64,${value}`}
          width={60}
          height={60}
        />
      </SelectItem>
    </Suspense>
  )
);

MemoizedSelectItem.displayName = "MemoizedSelectItem";

interface VirtualizedSelectItemsResult {
  itemCount: number;
  getItemKey: (index: number) => string;
  renderItem: (props: ListChildComponentProps) => React.ReactNode;
}

const useVirtualizedSelectItems = (
  faceData: FaceDataType
): VirtualizedSelectItemsResult => {
  const itemData = Object.entries(faceData.encoded_images);
  const itemCount = itemData.length;
  const getItemKey = (index: number) => itemData[index][0];
  const renderItem = ({ index, style }: ListChildComponentProps) => {
    const [key, image] = itemData[index];
    return (
      <div style={style}>
        <MemoizedSelectItem
          key={key}
          imageKey={key}
          value={image}
          className="capitalize"
        />
      </div>
    );
  };
  return { itemCount, getItemKey, renderItem };
};

export default function ActorList() {
  const dispatch = useDispatch();
  const faceData = useSelector((state: RootState) => state.subtitle.faceData);
  const { itemCount, getItemKey, renderItem } =
    useVirtualizedSelectItems(faceData);

  const handleSelect = (oldFace: string, newFace: string) => {
    const updatedFaceData = {
      ...faceData,
      encoded_images: Object.fromEntries(
        Object.entries(faceData.encoded_images).filter(
          ([key]) => key !== oldFace
        )
      ),
      data: faceData.data.map((item) => {
        if (item.group_image_encoded_ref === oldFace) {
          return {
            ...item,
            group_image_encoded_ref: newFace,
          };
        }
        return item;
      }),
    };
    dispatch(setFaceData(updatedFaceData));
  };

  return (
    <div className="m-5 w-1/2 flex flex-col h-[500px] overflow-y-auto bg-slate-500">
      {Object.entries(faceData.encoded_images).map(([key, image], index) => (
        <div className="flex flex-row items-center" key={index}>
          <img
            className="h-60px w-60px p-2"
            key={index}
            src={`data:image/png;base64,${image}`}
            alt=""
          />
          <span className="mx-10 text-white">{key}</span>
          <Select onValueChange={(e) => handleSelect(key, e)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              <FixedSizeList
                height={200}
                itemCount={itemCount}
                itemKey={getItemKey}
                itemSize={60}
                width={200}
              >
                {renderItem}
              </FixedSizeList>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
