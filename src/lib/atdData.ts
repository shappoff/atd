import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAtdFilterIndex } from "@/lib/atdRoute";
import { type AtdSlugLookup, buildAtdSlugLookup } from "@/lib/atdSlug";
import { ATD_FILTERS_PUBLIC_PATH, ATD_PLACES_PUBLIC_PATH } from "@/lib/paths";
import type { AtdFilterIndex } from "@/prebuild/atdHierarchy";

export type AtdPlaceLabel = {
  title: string;
  type: string;
};

let filterIndex: AtdFilterIndex | undefined;
let slugLookup: AtdSlugLookup | undefined;
let placesByPath: Map<string, AtdPlaceLabel[]> | undefined;

export function getAtdFilterIndex(): AtdFilterIndex {
  filterIndex ??= parseAtdFilterIndex(readPublicJson(ATD_FILTERS_PUBLIC_PATH));
  return filterIndex;
}

export function getAtdSlugLookup(): AtdSlugLookup {
  slugLookup ??= buildAtdSlugLookup(getAtdFilterIndex());
  return slugLookup;
}

export function getAtdPlacesByPath(): Map<string, AtdPlaceLabel[]> {
  if (!placesByPath) {
    placesByPath = indexPlaces(readPublicJson(ATD_PLACES_PUBLIC_PATH));
  }
  return placesByPath;
}

function readPublicJson(publicPath: string): unknown {
  const relative = publicPath.replace(/^\/+/, "");
  const filePath = join(process.cwd(), "public", relative);
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Failed to read ${filePath}: ${message}`);
  }
}

function indexPlaces(value: unknown): Map<string, AtdPlaceLabel[]> {
  const features = placeFeatures(value);
  const index = new Map<string, AtdPlaceLabel[]>();

  for (const feature of features) {
    const properties = feature.properties;
    if (!properties || typeof properties !== "object") {
      continue;
    }
    const title = textProperty(properties, "title");
    if (!title) {
      continue;
    }
    const type = textProperty(properties, "type");
    const paths = properties.paths;
    if (!Array.isArray(paths)) {
      continue;
    }
    for (const path of paths) {
      if (typeof path !== "string" || !path) {
        continue;
      }
      const list = index.get(path);
      const place = { title, type };
      if (list) {
        list.push(place);
      } else {
        index.set(path, [place]);
      }
    }
  }

  return index;
}

function placeFeatures(
  value: unknown,
): { properties?: Record<string, unknown> }[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("features" in value) ||
    !Array.isArray(value.features)
  ) {
    throw new Error("atdPlaces.geojson is not a feature collection");
  }
  return value.features.filter(
    (feature): feature is { properties?: Record<string, unknown> } =>
      typeof feature === "object" && feature !== null,
  );
}

function textProperty(
  properties: Record<string, unknown>,
  key: string,
): string {
  const value = properties[key];
  return typeof value === "string" ? value.trim() : "";
}
