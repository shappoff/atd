import { asString, mapRowToPlace } from "./rowMapper";
import type { PlaceItem, RawRow, SpreadsheetSource } from "./types";

export function processPlaceRows(
  rows: RawRow[],
  source: SpreadsheetSource,
): PlaceItem[] {
  if (rows.length === 0) {
    return [];
  }

  const titles = (rows[0] ?? []).map((cell) => asString(cell));
  const places: PlaceItem[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const place = mapRowToPlace(rows[rowIndex] ?? [], titles, rowIndex, source);
    if (place) {
      places.push(place);
    }
  }

  return places;
}
