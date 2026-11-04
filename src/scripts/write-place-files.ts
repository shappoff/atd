import fs from "node:fs";
import path from "node:path";
import { writePlaceDetailsIfStale } from "../prebuild/placeFiles";
import type { PlaceItem } from "../prebuild/types";

const jsonPath = path.join(process.cwd(), "public", "atdPlaces.json");

if (!fs.existsSync(jsonPath)) {
  throw new Error(`Missing place data at ${jsonPath}`);
}

const parsed: unknown = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
if (!Array.isArray(parsed)) {
  throw new Error("atdPlaces.json must be an array");
}

writePlaceDetailsIfStale(jsonPath, parsed as PlaceItem[]);
