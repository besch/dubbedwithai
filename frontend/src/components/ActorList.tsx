import { Suspense, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActorList() {
  const dispatch = useDispatch();
  const faceData = useSelector((state: RootState) => state.subtitle.faceData);

  return (
    <div className="m-5 w-1/3 flex flex-col h-[500px] overflow-y-auto">
      {Object.entries(faceData.encoded_images).map(([key, image], index) => (
        <div className="flex flex-row items-center" key={index}>
          <img
            className="h-60px w-60px p-2"
            key={index}
            src={`data:image/png;base64,${image}`}
            alt={`Encoded Image ${index}`}
          />
          <span className="ml-10 text-white">{key}</span>
        </div>
      ))}
    </div>
  );
}
