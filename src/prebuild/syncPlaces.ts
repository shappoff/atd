import { createHash } from "node:crypto";
import type { Database } from "firebase-admin/database";
import { getPlacesDatabase } from "./firebaseAdmin";
import {
  type PlaceDetails,
  placeDetailsPath,
  toPlaceDetails,
} from "./placeDetails";
import type { PlaceItem } from "./types";

const REVISIONS_PATH = "placeRevisions";
const BATCH_SIZE = 100;

type PlaceUpdate = PlaceDetails | string | null;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortValue(record[key]);
    }
    return sorted;
  }
  return value;
}

function revisionOf(details: PlaceDetails): string {
  const canonical = JSON.stringify(sortValue(details));
  return createHash("sha256").update(canonical).digest("hex");
}

function readRevisions(value: unknown): Map<string, string> {
  const revisions = new Map<string, string>();
  if (typeof value !== "object" || value === null) {
    return revisions;
  }

  for (const [row, hash] of Object.entries(value)) {
    if (typeof hash === "string") {
      revisions.set(row, hash);
    }
  }
  return revisions;
}

async function flush(
  database: Database,
  updates: Record<string, PlaceUpdate>,
): Promise<void> {
  const paths = Object.keys(updates);
  if (paths.length === 0) {
    return;
  }

  await database.ref().update(updates);
  for (const path of paths) {
    delete updates[path];
  }
}

export async function syncPlaceDetails(places: PlaceItem[]): Promise<number> {
  const database = getPlacesDatabase();
  const snapshot = await database.ref(REVISIONS_PATH).get();
  const remaining = readRevisions(snapshot.val());
  const updates: Record<string, PlaceUpdate> = {};
  let pending = 0;
  let updated = 0;

  const queue = async (
    row: string,
    details: PlaceDetails | null,
    hash: string | null,
  ) => {
    updates[placeDetailsPath(Number(row))] = details;
    updates[`${REVISIONS_PATH}/${row}`] = hash;
    pending += 1;
    updated += 1;
    if (pending >= BATCH_SIZE) {
      await flush(database, updates);
      pending = 0;
    }
  };

  for (const place of places) {
    const details = toPlaceDetails(place);
    const row = String(details.row);
    const hash = revisionOf(details);
    if (remaining.get(row) !== hash) {
      await queue(row, details, hash);
    }
    remaining.delete(row);
  }

  for (const row of remaining.keys()) {
    await queue(row, null, null);
  }

  await flush(database, updates);
  return updated;
}
