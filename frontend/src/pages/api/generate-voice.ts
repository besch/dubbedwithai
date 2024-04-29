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

    return new Promise((resolve, reject) => {
      let result = "";
      pythonProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
        result += data;
      });

      pythonProcess.on("error", (err) => {
        reject(err);
      });

      pythonProcess.on("close", (code) => {
        console.log("result", result);
        resolve(result);
      });
    });
  });
};

export default generateVoice;
