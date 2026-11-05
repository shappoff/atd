import type { PlaceItem } from "./types";

export const PLACES_PATH = "places";

export type PlaceDetails = Pick<
  PlaceItem,
  | "row"
  | "title"
  | "type"
  | "lat"
  | "lng"
  | "kostel"
  | "owner"
  | "link"
  | "eparchy"
  | "atd"
>;

export function placeDetailsPath(row: number): string {
  return `${PLACES_PATH}/${row}`;
}

export function toPlaceDetails(place: PlaceItem): PlaceDetails {
  return {
    row: place.row,
    title: place.title,
    type: place.type,
    lat: place.lat,
    lng: place.lng,
    kostel: place.kostel,
    owner: place.owner,
    link: place.link,
    eparchy: place.eparchy,
    atd: place.atd,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableNumber(value: unknown): number | null | undefined {
  // Realtime Database omits null, so a missing coordinate is an empty one.
  if (value == null) {
    return null;
  }
  return asFiniteNumber(value) ?? undefined;
}

function asStringRecord(value: unknown): Record<string, string> | null {
  // Realtime Database omits {}, so a missing year map is an empty one.
  if (value == null) {
    return {};
  }
  if (!isRecord(value)) {
    return null;
  }

  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      return null;
    }
    record[key] = entry;
  }
  return record;
}

export function parsePlaceDetails(value: unknown): PlaceDetails | null {
  if (!isRecord(value)) {
    return null;
  }

  const row = asFiniteNumber(value.row);
  const title = asString(value.title);
  const type = asString(value.type);
  const kostel = asString(value.kostel);
  const owner = asString(value.owner);
  const link = asString(value.link);
  const lat = asNullableNumber(value.lat);
  const lng = asNullableNumber(value.lng);
  const eparchy = asStringRecord(value.eparchy);
  const atd = asStringRecord(value.atd);

  if (
    row == null ||
    title == null ||
    type == null ||
    kostel == null ||
    owner == null ||
    link == null ||
    lat === undefined ||
    lng === undefined ||
    eparchy == null ||
    atd == null
  ) {
    return null;
  }

  return { row, title, type, lat, lng, kostel, owner, link, eparchy, atd };
}
