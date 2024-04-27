import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { generateVoice } from "@/actions/generate-voice";

const VoiceGenerator = () => {
  const voiceStyles: string[] = [
    "friendly",
    "cheerful",
    "excited",
    "sad",
    "angry",
    "terrified",
    "shouting",
    "whispering",
  ];
  const voiceActors: string[] = ["Bob", "Ana", "Jon"];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const voiceActor = formData.get("voiceactor") as string;
    const voiceStyle = formData.get("voicestyle") as string;
    const voiceLanguage = formData.get("voicelanguage") as string;
    const voiceSpeed = formData.get("voicespeed") as string;

    try {
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceActor,
          voiceStyle,
          voiceLanguage,
          voiceSpeed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        console.error("Error generating voice:", response.status);
      }
    } catch (error) {
      console.error("Error generating voice:", error);
    }
  };

  return (
    <Card className="w-[350px] m-10 mr-0">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="voiceactor">Voice actor</Label>
              <Select name="voiceactor">
                <SelectTrigger id="voiceactor">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {voiceActors.map((voiceActor, index) => (
                    <SelectItem
                      key={index}
                      value={voiceActor}
                      className="capitalize"
                    >
                      {voiceActor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="voicestyle">Voice style</Label>
              <Select name="voicestyle">
                <SelectTrigger id="voicestyle">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {voiceStyles.map((voiceStyle, index) => (
                    <SelectItem
                      key={index}
                      value={voiceStyle}
                      className="capitalize"
                    >
                      {voiceStyle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="voicelanguage">Language</Label>
              <Select name="voicelanguage">
                <SelectTrigger id="voicelanguage">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="voicespeed">Speed</Label>
              <Select name="voicespeed">
                <SelectTrigger id="voicespeed">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col space-y-1.5 mt-5">
            <Button type="submit">Generate</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VoiceGenerator;
