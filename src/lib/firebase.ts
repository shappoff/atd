import { getApps, initializeApp } from "firebase/app";
import { type Database, getDatabase } from "firebase/database";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set NEXT_PUBLIC_FIREBASE_* in .env (see .env.example).`,
    );
  }
  return value;
}

function readFirebaseConfig() {
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  return {
    apiKey: requireEnv(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    ),
    authDomain: requireEnv(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    ),
    databaseURL: requireEnv(
      "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    ),
    projectId: requireEnv(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    storageBucket: requireEnv(
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    ),
    messagingSenderId: requireEnv(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: requireEnv(
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ),
    ...(measurementId ? { measurementId } : {}),
  };
}

export function getPlacesDatabase(): Database {
  const app = getApps()[0] ?? initializeApp(readFirebaseConfig());
  return getDatabase(app);
}
