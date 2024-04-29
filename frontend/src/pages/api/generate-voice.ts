import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import formidable from "formidable-serverless";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = new Storage({
  projectId: process.env.project_id,
  credentials: {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key,
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain,
  },
});

const generateVoice = async (req: NextApiRequest, res: NextApiResponse) => {
  const audioFilePath =
    "C:\\Users\\user\\Desktop\\Projects\\dubbedwithai\\tmp\\outputs\\output__cheerful__00_01_51.991__00_01_57.759.wav";

  const bucketName = "dubbed_with_ai";
  const destFileName = `${Date.now()}__${path.basename(audioFilePath)}`;

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

      pythonProcess.on("close", async (code) => {
        let audioFilePath = result.split("final_save_path ")[1];
        audioFilePath = audioFilePath.trim();
        audioFilePath = path.normalize(audioFilePath);

        // // Return the audio file path or URL
        // res.status(200).json({ audioFilePath });

        try {
          await storage.bucket(bucketName).upload(audioFilePath, {
            destination: destFileName,
          });

          // Get the public URL of the uploaded file
          const fileUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;

          // Return the public URL of the uploaded audio file
          res.status(200).json({ audioFileUrl: fileUrl });
        } catch (err) {
          console.error("Error uploading file:", err);
          res.status(500).json({ error: err });
        }
      });
    });
  });
};

export default generateVoice;
