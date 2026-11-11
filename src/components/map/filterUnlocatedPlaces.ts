import {
  type AtdFilterSelection,
  collectAtdPaths,
  featurePathsMatch,
  pathKey,
} from "@/prebuild/atdHierarchy";
import type { PlaceDetails } from "@/prebuild/placeDetails";

export type UnlocatedPlace = PlaceDetails & {
  paths: string[];
};

/** Uezd or volost only. A gubernia-wide filter does not list unlocated places. */
export function unlocatedListActive(selection: AtdFilterSelection): boolean {
  return selection.uezd != null || selection.volost != null;
}

export function unlocatedPathKeys(place: Pick<PlaceDetails, "atd">): string[] {
  return collectAtdPaths(place.atd).map(pathKey);
}

export function filterUnlocatedPlaces(
  places: readonly UnlocatedPlace[],
  selection: AtdFilterSelection,
): UnlocatedPlace[] {
  if (!unlocatedListActive(selection)) {
    return [];
  }

  const matched = places.filter((place) =>
    featurePathsMatch(place.paths, selection),
  );
  matched.sort(
    (left, right) =>
      left.title.localeCompare(right.title, "ru") || left.row - right.row,
  );
  return matched;
}

export function unlocatedScopeLabel(selection: AtdFilterSelection): string {
  if (selection.volost && selection.uezd) {
    return `${selection.volost}, ${selection.uezd}`;
  }
  return selection.volost ?? selection.uezd ?? "";
}
