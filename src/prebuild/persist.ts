import fs from "node:fs";
import path from "node:path";
import { buildAtdFilterIndex } from "./atdHierarchy";
import { toPlacesGeoJson } from "./placesGeoJson";
import type { PlaceItem } from "./types";

const publicDir = path.join(process.cwd(), "public");
const atdPlacesPath = path.join(publicDir, "atdPlaces.json");
const atdPlacesGeoJsonPath = path.join(publicDir, "atdPlaces.geojson");
const atdFiltersPath = path.join(publicDir, "atdFilters.json");

export type PersistPlacesResult = {
  jsonPath: string;
  geojsonPath: string;
  filtersPath: string;
  featureCount: number;
  filterPathCount: number;
};

function writeJson(filePath: string, contents: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(contents)}\n`, "utf8");
}

export function persistPlaces(places: PlaceItem[]): PersistPlacesResult {
  const geojson = toPlacesGeoJson(places);
  const filters = buildAtdFilterIndex(places);
  writeJson(atdPlacesPath, places);
  writeJson(atdPlacesGeoJsonPath, geojson);
  writeJson(atdFiltersPath, filters);

  return {
    jsonPath: atdPlacesPath,
    geojsonPath: atdPlacesGeoJsonPath,
    filtersPath: atdFiltersPath,
    featureCount: geojson.features.length,
    filterPathCount: filters.paths.length,
  };
}

export function readPersistedPlaces(): PlaceItem[] | null {
  if (!fs.existsSync(atdPlacesPath)) {
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(atdPlacesPath, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    return null;
  }
  return raw as PlaceItem[];
}
