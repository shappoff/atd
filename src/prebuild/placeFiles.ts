import fs from "node:fs";
import path from "node:path";
import {
  type PlaceDetails,
  placeShardName,
  toPlaceDetails,
} from "./placeDetails";
import type { PlaceItem } from "./types";

const placesDir = path.join(process.cwd(), "public", "places");

export function writePlaceDetails(places: PlaceItem[]): void {
  fs.rmSync(placesDir, { recursive: true, force: true });
  fs.mkdirSync(placesDir, { recursive: true });

  const shards = new Map<string, PlaceDetails[]>();
  for (const place of places) {
    const details = toPlaceDetails(place);
    const name = placeShardName(details.row);
    const shard = shards.get(name);
    if (shard) {
      shard.push(details);
    } else {
      shards.set(name, [details]);
    }
  }

  for (const [name, shard] of shards) {
    fs.writeFileSync(
      path.join(placesDir, name),
      `${JSON.stringify(shard)}\n`,
      "utf8",
    );
  }

  fs.writeFileSync(path.join(placesDir, ".stamp"), "", "utf8");
}

export function writePlaceDetailsIfStale(
  jsonPath: string,
  places: PlaceItem[],
): void {
  const stampPath = path.join(placesDir, ".stamp");
  if (fs.existsSync(stampPath)) {
    const stampMtime = fs.statSync(stampPath).mtimeMs;
    const jsonMtime = fs.statSync(jsonPath).mtimeMs;
    if (stampMtime >= jsonMtime) {
      return;
    }
  }

  writePlaceDetails(places);
}
