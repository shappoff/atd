import { findPlaceDetails, type PlaceDetails } from "@/prebuild/placeDetails";

export async function loadPlaceDetails(
  url: string,
  row: number,
): Promise<PlaceDetails> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Place details request failed: ${response.status}`);
  }

  const details = findPlaceDetails(await response.json(), row);
  if (!details) {
    throw new Error(`Place ${row} is missing from ${url}`);
  }

  return details;
}
