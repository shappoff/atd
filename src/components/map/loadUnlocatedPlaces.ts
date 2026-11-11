import { hasPlaceCoordinates } from "@/prebuild/placeCoordinates";
import { parsePlaceDetails } from "@/prebuild/placeDetails";
import {
  type UnlocatedPlace,
  unlocatedPathKeys,
} from "./filterUnlocatedPlaces";

export function readUnlocatedPlaces(
  url: string,
  signal: AbortSignal,
): Promise<UnlocatedPlace[]> {
  return fetch(url, { signal }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load unlocated places: ${response.status}`);
    }

    const value: unknown = await response.json();
    if (!Array.isArray(value)) {
      throw new Error("Unlocated places must be an array");
    }

    const places: UnlocatedPlace[] = [];
    for (const item of value) {
      const place = parsePlaceDetails(item);
      if (!place || hasPlaceCoordinates(place)) {
        continue;
      }
      places.push({
        ...place,
        paths: unlocatedPathKeys(place),
      });
    }
    return places;
  });
}
