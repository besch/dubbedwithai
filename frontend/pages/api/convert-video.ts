// pages/api/convert-video.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable-serverless";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

const convertVideoToAudio = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const videoFile = files.file as formidable.File;
    const videoPath = videoFile.path;
    // console.log("videoFile", videoFile);
    // console.log("videoPath", videoPath);
    const audioPath = `${videoPath.split(".")[0]}.mp3`;

    console.log("__dirname", __dirname);
    const python_script = path.join(__dirname, "../../../../../src/main.py");
    console.log("!!!!!!!!!!!!!python_script", python_script);

    // Convert video to audio using Python
    const pythonProcess = spawn("python", [
      python_script,
      videoPath,
      audioPath,
    ]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);

      // Read the converted audio file and send it back to the client
      const audioData = fs.readFileSync(audioPath);
      const audioBuffer = Buffer.from(audioData);

      res.status(200).json({
        audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`,
      });

      // Clean up temporary files
      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);
    });
  });
};

export default convertVideoToAudio;
