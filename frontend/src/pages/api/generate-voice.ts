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

    console.log(fields);

    const python_script = path.join(
      __dirname,
      "../../../../../src/generate_voice.py"
    );
    const fieldsString = JSON.stringify(fields);
    const pythonProcess = spawn("python", [python_script, fieldsString]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  });
};

export default generateVoice;
