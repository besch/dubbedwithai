import { Storage } from "@google-cloud/storage";

const storageConfig = new Storage({
  projectId: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
  },
});

export default storageConfig;
