import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";
import { setCanvasImage, setIsCanvasActive } from "@/store/slices/video";
import { setFaceData, setSubtitles } from "@/store/slices/subtitle";

const AddNewActor = () => {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState<boolean>(false);
  const { faceData, subtitles, selectedSubtitleIndexes } = useSelector(
    (state: RootState) => state.subtitle
  );
  const { canvasImage } = useSelector((state: RootState) => state.video);

  const activateCanvas = () => {
    dispatch(setIsCanvasActive(true));
  };

  const handleAddNewActor = (e) => {
    const randomKey = Math.floor(100000 + Math.random() * 900000);
    const faceDataClone = JSON.parse(JSON.stringify(faceData));

    faceDataClone.encoded_images = {
      ...faceData.encoded_images,
      [randomKey]: canvasImage,
    };
    dispatch(setFaceData(faceDataClone));

    const updatedSubtitles = subtitles.map((subtitle) => {
      if (subtitle.index === selectedSubtitleIndexes[0]) {
        return {
          ...subtitle,
          actorName: randomKey.toString(),
        };
      }
      return subtitle;
    });

    dispatch(setSubtitles(updatedSubtitles));
    dispatch(setCanvasImage(null));
  };

  return (
    <div className="my-4 w-[300px]">
      {!showForm ? (
        <FaPlus
          data-tooltip-id="dubbedWithAITooltip"
          data-tooltip-content="Add new actor"
          onClick={() => setShowForm(true)}
          className="text-3xl text-gray-500 cursor-pointer"
        />
      ) : (
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="actor">New Actor</Label>
            <Input id="actor" placeholder="Actor name" />
            <div className="flex flex-row gap-2">
              <Button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={activateCanvas}
              >
                Capture Image
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  dispatch(setIsCanvasActive(false));
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleAddNewActor}
              >
                Apply
              </Button>
            </div>
            {canvasImage && (
              <img
                alt="canvas"
                className="p-2 w-[80px] h-[80px]"
                src={`data:image/png;base64,${canvasImage}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNewActor;
