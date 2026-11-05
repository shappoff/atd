import { cert, deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { type Database, getDatabase } from "firebase-admin/database";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env (see .env.example).`);
  }
  return value;
}

export function getPlacesDatabase(): Database {
  const databaseURL = requireEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL");
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const clientEmail = requireEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      databaseURL,
    });
  }

  return getDatabase();
}

export async function closePlacesDatabase(): Promise<void> {
  await Promise.all(getApps().map((app) => deleteApp(app)));
}
