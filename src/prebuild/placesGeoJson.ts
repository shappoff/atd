import type { PlaceItem } from "./types";

export type PlaceFeatureProperties = {
  title: string;
  type: string;
};

export type PlaceFeature = {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: [lng: number, lat: number];
  };
  properties: PlaceFeatureProperties;
};

export type PlacesGeoJson = {
  type: "FeatureCollection";
  features: PlaceFeature[];
};

function hasCoordinates(
  place: PlaceItem,
): place is PlaceItem & { lat: number; lng: number } {
  return (
    place.lat != null &&
    place.lng != null &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

export function toPlacesGeoJson(places: PlaceItem[]): PlacesGeoJson {
  const features: PlaceFeature[] = [];

  for (const place of places) {
    if (!hasCoordinates(place)) {
      continue;
    }

    features.push({
      type: "Feature",
      id: place.row,
      geometry: {
        type: "Point",
        coordinates: [place.lng, place.lat],
      },
      properties: {
        title: place.title,
        type: place.type,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
