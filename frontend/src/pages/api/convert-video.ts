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
    const audioPath = `${videoPath.split(".")[0]}.mp3`;

    const python_script = path.join(__dirname, "../../../../../src/main.py");

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

      // Clean up temporary files
      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);
    });
  });
};

const sendVideoFile = async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const videoFile = files.file as formidable.File;
    const videoPath = videoFile.path;

    res.setHeader("Content-Type", videoFile.type); // Use the correct MIME type of the video file
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${videoFile.name}"`
    );

    // Create a readable stream from the video file
    const stream = fs.createReadStream(videoPath);

    // Pipe the stream to the response
    stream.pipe(res);

    // Clean up temporary file when the stream finishes
    stream.on("end", () => {
      fs.unlinkSync(videoPath);
    });
  });
};

export default sendVideoFile;
