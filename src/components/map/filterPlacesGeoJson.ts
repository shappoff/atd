import {
  type AtdFilterSelection,
  featurePathsMatch,
  hasAtdFilterSelection,
} from "@/prebuild/atdHierarchy";
import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";

export function filterPlacesGeoJson(
  data: PlacesGeoJson,
  selection: AtdFilterSelection,
  searchResultIds: number[] | null = null,
): PlacesGeoJson {
  if (!hasAtdFilterSelection(selection) && searchResultIds == null) {
    return data;
  }

  const resultIds = searchResultIds == null ? null : new Set(searchResultIds);
  return {
    type: "FeatureCollection",
    features: data.features.filter(
      (feature) =>
        featurePathsMatch(feature.properties.paths, selection) &&
        (resultIds == null || resultIds.has(feature.id)),
    ),
  };
}
