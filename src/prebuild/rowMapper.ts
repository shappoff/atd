import type { PlaceItem, RawCell, RawRow, SpreadsheetSource } from "./types";

const IDENTITY_FIELDS = [
  "title",
  "type",
  "lat",
  "lng",
  "kostel",
  "owner",
  "link",
] as const;

type IdentityField = (typeof IDENTITY_FIELDS)[number];

const YEAR_HEADER = /^\d{4}$/;

export function asString(value: RawCell): string {
  return String(value ?? "").trim();
}

export function asNumber(value: RawCell): number | null {
  const text = asString(value).replace(",", ".");
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function isYearHeader(header: string): boolean {
  return YEAR_HEADER.test(header);
}

function isIdentityField(header: string): header is IdentityField {
  return IDENTITY_FIELDS.includes(header as IdentityField);
}

export function mapRowToPlace(
  row: RawRow,
  titles: string[],
  rowIndex: number,
  source: SpreadsheetSource,
): PlaceItem | null {
  const kostelIndex = titles.indexOf("kostel");
  const identity: Record<IdentityField, string> = {
    title: "",
    type: "",
    lat: "",
    lng: "",
    kostel: "",
    owner: "",
    link: "",
  };
  const eparchy: Record<string, string> = {};
  const atd: Record<string, string> = {};

  titles.forEach((title, cellIndex) => {
    const header = asString(title);
    const value = asString(row[cellIndex]);

    if (isIdentityField(header)) {
      identity[header] = value;
      return;
    }

    if (!isYearHeader(header) || !value) {
      return;
    }

    if (kostelIndex >= 0 && cellIndex < kostelIndex) {
      eparchy[header] = value;
      return;
    }

    if (kostelIndex >= 0 && cellIndex > kostelIndex) {
      atd[header] = value;
    }
  });

  const lat = asNumber(identity.lat);
  const lng = asNumber(identity.lng);

  if (!identity.title && lat == null && lng == null) {
    return null;
  }

  return {
    title: identity.title,
    type: identity.type,
    lat,
    lng,
    kostel: identity.kostel,
    owner: identity.owner,
    link: identity.link,
    eparchy,
    atd,
    row: rowIndex + 1,
    spreadsheetId: source.spreadsheetId,
    gid: source.gid,
  };
}
