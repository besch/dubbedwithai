import { Storage } from "@google-cloud/storage";

console.log(
  process.env.GOOGLE_CLOUD_PROJECT_ID,
  process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n")
);

const storageConfig = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

export default storageConfig;
