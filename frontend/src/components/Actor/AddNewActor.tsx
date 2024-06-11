import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";

const AddNewActor = () => {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState<boolean>(false);
  const subtitleState = useSelector((state: RootState) => state.subtitle);
  const { faceData, subtitles, selectedSubtitleIndexes } = subtitleState;

  const handleAddNewName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // const newSubtitles = subtitles.map((subtitle) => {
    //   if (selectedSubtitleIndexes.includes(subtitle.index)) {
    //     return {
    //       ...subtitle,
    //       actorName: event.currentTarget.elements.actor.value,
    //     };
    //   }
    //   return subtitle;
    // });
    // dispatch(setSubtitles(newSubtitles));
    setShowForm(false);
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
        <form onSubmit={handleAddNewName}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="actor">New Actor</Label>
              <Input id="actor" placeholder="Actor name" />
              <div className="flex flex-row gap-2">
                <Button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  type="submit"
                >
                  Add
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddNewActor;
