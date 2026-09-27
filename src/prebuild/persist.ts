import fs from "node:fs";
import path from "node:path";
import { toPlacesGeoJson } from "./placesGeoJson";
import type { PlaceItem } from "./types";

const publicDir = path.join(process.cwd(), "public");
const atdPlacesPath = path.join(publicDir, "atdPlaces.json");
const atdPlacesGeoJsonPath = path.join(publicDir, "atdPlaces.geojson");

export type PersistPlacesResult = {
  jsonPath: string;
  geojsonPath: string;
  featureCount: number;
};

function writeJson(filePath: string, contents: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(contents)}\n`, "utf8");
}

export function persistPlaces(places: PlaceItem[]): PersistPlacesResult {
  const geojson = toPlacesGeoJson(places);
  writeJson(atdPlacesPath, places);
  writeJson(atdPlacesGeoJsonPath, geojson);

  return {
    jsonPath: atdPlacesPath,
    geojsonPath: atdPlacesGeoJsonPath,
    featureCount: geojson.features.length,
  };
}
