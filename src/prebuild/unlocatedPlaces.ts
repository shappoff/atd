import { hasPlaceCoordinates } from "./placeCoordinates";
import { type PlaceDetails, toPlaceDetails } from "./placeDetails";
import type { PlaceItem } from "./types";

export function toUnlocatedPlaces(places: PlaceItem[]): PlaceDetails[] {
  const unlocated: PlaceDetails[] = [];

  for (const place of places) {
    if (!hasPlaceCoordinates(place)) {
      unlocated.push(toPlaceDetails(place));
    }
  }

  return unlocated;
}
