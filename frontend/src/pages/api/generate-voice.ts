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
  credentials: {
    type: "service_account",
    project_id: "chrome-extension-rating-411421",
    private_key_id: "d0069039474b9fcf88d2d9b9f6fbf7214e250d60",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMRN/DwmExYXT4\n+I66Z0uAx48LhskIT/DHVNlU2HeDlM0xl/9T7Fr0UgFCTkY59hAj6MB6HxkT6R7b\nPvEtt6atdFtabqEFYAyoPi2S8ILYgfWZp0L8DF6WdRCZXhInGR7rXuPySW/neA7Z\nuwn0Cwc88ROxr/ToHSgH9MHm90ARXEYGiu7gSwNVFk4xJ+CkDRgTsT7aKlZ3kUkI\nv7iZVb0kJA4WrKSA4tSLlJ/AQ7OlqKa+qz6T8ZBFPFlcnu9ryffmJk8tJrQugtg2\nh6qVqPk1E4y3PAuNoPyotZd9HO8INl50rXb+RcCBk7v9+kGThO5A8XdIiI4/zDF8\n1aGR7+DhAgMBAAECggEAC5J0DnunFpKWeqLQ7Z5ve3KbQcVvKOUldWBx5J7OL1gT\nnKOQUD1n3I+2ZGC+SPJcrwW4+Wo+4KZjIg3dilrEILvAfKOzW5TqvmeQzXZTqSaB\nm1lR/KbNl+aVBb4dy8V2CE+GCTtXRNaiDQLyBYTyZivyZr6gOxUKtCtUYuhji/r8\nUY+1BjDknQ775EAHYyPvvtmT3BSe02dVUhXEcsymnxknwTvVPjyjIjauJRuccuEz\nbSHhyf7uLhQI2su0vG8RgVxvueMqn8o8eC4kAL/wRaYiuBPyYepvCydo1aq/pfEQ\n6d9xDPawyRQoJupBBPElqFUq/6XapVjzDEn38aakkQKBgQDCyFa7oxDci9CHWf/8\ngZplckYE0F9+OL5O5x8jX6eiSl9xohcDKayWOm00zq3lJlek3AQ9PMYEYttyJwsa\nbIfoAflkE1xYZKPw94UjSNsCa3PNLekeAoba+rCx1HFmQBKPRUvrpGxQKompcGUd\neZv1HXcXcHBR2Bx4tg2J/tVPaQKBgQC4Wodc/kgXzYR31zgBuBy+E0OiOHR5YdGa\n7gZ/lYHcmYDc4L9SSh0qtccbOCVE4VH2qO6fhl2rA+0p4jTKcZPoBwbJfenSJjrj\nfGRCJzN0MnINM3lIJpQjVTIys+A0w+RemxHQRVMHc3Btq9q461LHqSBrtqx+NaKE\nPoM8m2vOuQKBgQCcoHI2AeL+JaNyI2nXxvO7XY92MYSIP+KwGeONE07+DmX/PwLY\nNTultae5DfUBTbquQ4lZILRuNHwXp9Oi1ODYLDY5ReQ84/h8PN0fSWdq47LDq4ZH\n7mo4Tduls5nYSe9iq6tn+dhrAjmeOVXlxLMnACGShISdG3WRj3sFmxg1+QKBgFCF\nchRjGHgVEyQJA/R0R1GaNnNXd0BBQn0KNBpr4fHJtmhDXi2CI6UxCotQBa9FPzie\nZsOUu7rjlyYxIF/AJhs1XniJn6RjgFs2TNA8MRQyqHAtqG6kMxYPs0JEIMzLNyc/\nUhOHBBIAEP5GDt2wI1MEAx4pBsSFhrt+VnIVbIw5AoGAAxFP+hHwXDx64fGtuzg6\nezY6VEtoOdWYnorPXyxyO54pQNt2qB+rcmSNC0OhF4vvKuVd3QCYC84XAVhpMT/G\nojUrV4VygCgHkZB/IaYC+9Pg4otbipumv+YyGvTh1N6GH9I6o9QOcgVbo/lDU0N4\nhdVc1rh8pgpGqm+ChhKt0FA=\n-----END PRIVATE KEY-----\n",
    client_email:
      "kola-965@chrome-extension-rating-411421.iam.gserviceaccount.com",
    client_id: "104223163784500271522",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/kola-965%40chrome-extension-rating-411421.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
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
