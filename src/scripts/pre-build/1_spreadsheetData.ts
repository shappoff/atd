import {
  getFirstSheetMeta,
  getSheetValues,
  hasGoogleSheetsCredentials,
  toSheetRange,
} from "@/prebuild/gsheets";
import { persistPlaces } from "@/prebuild/persist";
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
  const outputPath = persistPlaces(places);

  console.log(`Saved ${places.length} places to ${outputPath}`);
}
