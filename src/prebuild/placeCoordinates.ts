type PlaceCoordinates = {
  lat: number | null;
  lng: number | null;
};

export function hasPlaceCoordinates<T extends PlaceCoordinates>(
  place: T,
): place is T & { lat: number; lng: number } {
  return (
    place.lat != null &&
    place.lng != null &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}
