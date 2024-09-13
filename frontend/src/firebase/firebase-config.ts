// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function logApiRequest(data: {
  endpoint: string;
  ip: string;
  time: number;
  movieName?: string;
  language?: string;
  season?: number;
  episode?: number;
  subtitlesFound?: boolean;
  subtitlesStep?: string;
  error?: string;
}) {
  try {
    await addDoc(collection(db, "api_logs"), {
      ...data,
      timestamp: new Date(),
      time: data.time || Date.now(),
    });
  } catch (error) {
    console.error("Error logging to Firebase:", error);
  }
}

export { app, db, logApiRequest };
