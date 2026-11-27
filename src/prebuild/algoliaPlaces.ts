import type { AtdPath } from "./atdHierarchy";
import { collectAtdPaths } from "./atdHierarchy";
import type { PlaceItem } from "./types";

export type AlgoliaPlaceRecord = {
  objectID: string;
  row: number;
  title: string;
  type: string;
  lat: number | null;
  lng: number | null;
  atdPaths: AtdPath[];
  atdPathTokens: string[];
};

export type AlgoliaPlaceSearchHit = Omit<AlgoliaPlaceRecord, "atdPathTokens">;

export function atdPathToken(path: AtdPath): string {
  return encodeURIComponent(
    JSON.stringify([path.gubernia, path.uezd, path.volost]),
  );
}

export function toAlgoliaPlaceRecords(
  places: PlaceItem[],
): AlgoliaPlaceRecord[] {
  return places
    .filter((place) => place.title.trim().length > 0)
    .map((place) => {
      const atdPaths = collectAtdPaths(place.atd);
      return {
        objectID: String(place.row),
        row: place.row,
        title: place.title,
        type: place.type,
        lat: place.lat,
        lng: place.lng,
        atdPaths,
        atdPathTokens: atdPaths.map(atdPathToken),
      };
    });
}
