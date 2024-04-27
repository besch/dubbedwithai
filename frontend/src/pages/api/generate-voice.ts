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

const generateVoice = async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    console.log("fields", fields);

    // const videoFile = files.file as formidable.File;
    // const videoPath = videoFile.path;
    // const audioPath = `${videoPath.split(".")[0]}.mp3`;

    // const python_script = path.join(__dirname, "../../../../../src/main.py");

    // // Convert video to audio using Python
    // const pythonProcess = spawn("python", [
    //   python_script,
    //   videoPath,
    //   audioPath,
    // ]);

    // pythonProcess.stdout.on("data", (data) => {
    //   console.log(`stdout: ${data}`);
    // });

    // pythonProcess.stderr.on("data", (data) => {
    //   console.error(`stderr: ${data}`);
    // });

    // pythonProcess.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);

    //   // Clean up temporary files
    //   fs.unlinkSync(videoPath);
    //   fs.unlinkSync(audioPath);
    // });
  });
};

export default generateVoice;
