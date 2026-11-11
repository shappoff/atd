import {
  getFirstSheetMeta,
  getSheetValues,
  hasGoogleSheetsCredentials,
  toSheetRange,
} from "@/prebuild/gsheets";
import { persistPlaces, readPersistedPlaces } from "@/prebuild/persist";
import { processPlaceRows } from "@/prebuild/pipeline";
import {
  ATD_PLACES_RANGE,
  ATD_PLACES_SPREADSHEET_ID,
} from "@/prebuild/spreadsheetSources";
import type { RawRow } from "@/prebuild/types";

function requireCredentials(): boolean {
  if (hasGoogleSheetsCredentials()) {
    return true;
  }

  if (process.env.npm_lifecycle_event === "extract") {
    throw new Error(
      "Google Sheets credentials are missing. Set PROJECT_ID / GAPI_CREDENTIALS_* in .env.local (see .env.example).",
    );
  }

  console.warn(
    "Skipping Google Sheets extract: missing GAPI credentials. Using existing public/atdPlaces.json if present.",
  );
  return false;
}

export default async function extractSpreadsheetData() {
  console.log("Google sheets pre-build data update");

  if (!requireCredentials()) {
    const existing = readPersistedPlaces();
    if (!existing) {
      console.warn("No existing public/atdPlaces.json to refresh.");
      return;
    }
    const result = persistPlaces(existing);
    console.log(`Refreshed ${existing.length} places to ${result.jsonPath}`);
    console.log(
      `Saved ${result.featureCount} map features to ${result.geojsonPath}`,
    );
    console.log(
      `Saved ${result.filterPathCount} filter paths to ${result.filtersPath}`,
    );
    console.log(
      `Saved ${result.unlocatedCount} unlocated places to ${result.unlocatedPath}`,
    );
    return;
  }

  const meta = await getFirstSheetMeta(ATD_PLACES_SPREADSHEET_ID);
  const rows = (await getSheetValues({
    spreadsheetId: ATD_PLACES_SPREADSHEET_ID,
    range: toSheetRange(meta.title, ATD_PLACES_RANGE),
  })) as RawRow[];

  const places = processPlaceRows(rows, {
    spreadsheetId: ATD_PLACES_SPREADSHEET_ID,
    gid: meta.gid,
  });
  const result = persistPlaces(places);

  console.log(`Saved ${places.length} places to ${result.jsonPath}`);
  console.log(
    `Saved ${result.featureCount} map features to ${result.geojsonPath}`,
  );
  console.log(
    `Saved ${result.filterPathCount} filter paths to ${result.filtersPath}`,
  );
  console.log(
    `Saved ${result.unlocatedCount} unlocated places to ${result.unlocatedPath}`,
  );
}
