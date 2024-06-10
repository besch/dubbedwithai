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
          className=""
          src={`data:image/png;base64,${value}`}
          width={60}
          height={60}
        />
        <div className="ml-2">{imageKey}</div>
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
          className="capitalize flex align-center flex-row"
        />
      </div>
    );
  };
  return { itemCount, getItemKey, renderItem };
};

const SelectActor = () => {
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
    <div className="my-4 w">
      <Select onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select Actor" />
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
  );
};

export default SelectActor;
