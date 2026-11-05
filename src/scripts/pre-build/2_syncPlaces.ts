import fs from "node:fs";
import path from "node:path";
import {
  closePlacesDatabase,
  getPlacesDatabase,
  hasFirebaseAdminCredentials,
} from "@/prebuild/firebaseAdmin";
import { syncPlaceDetails } from "@/prebuild/syncPlaces";
import type { PlaceItem } from "@/prebuild/types";

const jsonPath = path.join(process.cwd(), "public", "atdPlaces.json");

function readPlaces(value: unknown): PlaceItem[] {
  if (!Array.isArray(value)) {
    throw new Error("atdPlaces.json must be an array");
  }

  const places: PlaceItem[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("atdPlaces.json must contain place objects");
    }
    places.push(item as PlaceItem);
  }
  return places;
}

export default async function syncPlaces(): Promise<void> {
  if (!hasFirebaseAdminCredentials()) {
    console.warn(
      "Skipping Firebase place sync: missing Firebase admin credentials. Set NEXT_PUBLIC_FIREBASE_DATABASE_URL, NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (see .env.example).",
    );
    return;
  }

  if (!fs.existsSync(jsonPath)) {
    console.warn(
      "Skipping Firebase place sync: public/atdPlaces.json is missing.",
    );
    return;
  }

  try {
    getPlacesDatabase();
    const places = readPlaces(JSON.parse(fs.readFileSync(jsonPath, "utf8")));
    const updated = await syncPlaceDetails(places);
    if (updated === 0) {
      console.log("Place details in Realtime Database are unchanged");
      return;
    }

    console.log(`Updated ${updated} places in Realtime Database`);
  } finally {
    await closePlacesDatabase();
  }
}
