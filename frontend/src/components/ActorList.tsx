import { setFaceData, FaceDataType } from "@/store/slices/subtitle";
import { Suspense, lazy, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FixedSizeList } from "react-window";

const LazyLoadedImage = lazy(() => import("next/image"));

const LazyImage = ({ src, width, height, ...props }) => (
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

const MemoizedSelectItem = memo(({ imageKey, value, className }) => (
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
));

const useVirtualizedSelectItems = (faceData: FaceDataType) => {
  const itemData = Object.entries(faceData.encoded_images);
  const itemCount = itemData.length;
  const getItemKey = (index) => itemData[index][0];
  const renderItem = ({ index, style }) => {
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
    <div className="m-5 w-1/2 flex flex-col h-[500px] overflow-y-auto">
      {Object.entries(faceData.encoded_images).map(([key, image], index) => (
        <div className="flex flex-row items-center" key={index}>
          <img
            className="h-60px w-60px p-2"
            key={index}
            src={`data:image/png;base64,${image}`}
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
