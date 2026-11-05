import {
  type AtdFilterSelection,
  featurePathsMatch,
  hasAtdFilterSelection,
} from "@/prebuild/atdHierarchy";
import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";

export function filterPlacesGeoJson(
  data: PlacesGeoJson,
  selection: AtdFilterSelection,
): PlacesGeoJson {
  if (!hasAtdFilterSelection(selection)) {
    return data;
  }

  return {
    type: "FeatureCollection",
    features: data.features.filter((feature) =>
      featurePathsMatch(feature.properties.paths, selection),
    ),
  };
}
