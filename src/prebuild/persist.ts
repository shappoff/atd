import fs from "node:fs";
import path from "node:path";
import { buildAtdFilterIndex } from "./atdHierarchy";
import { toPlacesGeoJson } from "./placesGeoJson";
import type { PlaceItem } from "./types";
import { toUnlocatedPlaces } from "./unlocatedPlaces";

const publicDir = path.join(process.cwd(), "public");
const atdPlacesPath = path.join(publicDir, "atdPlaces.json");
const atdPlacesGeoJsonPath = path.join(publicDir, "atdPlaces.geojson");
const atdFiltersPath = path.join(publicDir, "atdFilters.json");
const atdUnlocatedPath = path.join(publicDir, "atdUnlocated.json");

export type PersistPlacesResult = {
  jsonPath: string;
  geojsonPath: string;
  filtersPath: string;
  unlocatedPath: string;
  featureCount: number;
  filterPathCount: number;
  unlocatedCount: number;
};

function writeJson(filePath: string, contents: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(contents)}\n`, "utf8");
}

export function persistPlaces(places: PlaceItem[]): PersistPlacesResult {
  const geojson = toPlacesGeoJson(places);
  const filters = buildAtdFilterIndex(places);
  const unlocated = toUnlocatedPlaces(places);
  writeJson(atdPlacesPath, places);
  writeJson(atdPlacesGeoJsonPath, geojson);
  writeJson(atdFiltersPath, filters);
  writeJson(atdUnlocatedPath, unlocated);

  return {
    jsonPath: atdPlacesPath,
    geojsonPath: atdPlacesGeoJsonPath,
    filtersPath: atdFiltersPath,
    unlocatedPath: atdUnlocatedPath,
    featureCount: geojson.features.length,
    filterPathCount: filters.paths.length,
    unlocatedCount: unlocated.length,
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
