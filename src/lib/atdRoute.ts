import { type AtdSlugLookup, buildAtdSlugLookup } from "@/lib/atdSlug";
import {
  ATD_LEVELS,
  type AtdFilterIndex,
  type AtdFilterSelection,
  type AtdPath,
  EMPTY_ATD_FILTER_SELECTION,
} from "@/prebuild/atdHierarchy";

export function atdPathnameSegments(pathname: string): string[] {
  return pathname
    .split("/")
    .filter(Boolean)
    .map(decodeAtdSegment)
    .filter(Boolean);
}

export function atdSelectionSegments(
  selection: AtdFilterSelection,
  lookup: AtdSlugLookup,
): string[] {
  return ATD_LEVELS.flatMap((level) => {
    const name = selection[level];
    if (!name) {
      return [];
    }
    const slug = lookup.slugByName[level].get(name);
    return slug ? [slug] : [];
  });
}

export function atdSelectionPath(
  selection: AtdFilterSelection,
  lookup: AtdSlugLookup,
): string {
  const segments = atdSelectionSegments(selection, lookup);
  if (segments.length === 0) {
    return "/";
  }
  return `/${segments.join("/")}/`;
}

export function atdSelectionFromPathname(
  pathname: string,
  lookup: AtdSlugLookup,
): AtdFilterSelection {
  return atdSelectionFromSegments(atdPathnameSegments(pathname), lookup);
}

export function atdStaticParams(index: AtdFilterIndex): { atd: string[] }[] {
  const lookup = buildAtdSlugLookup(index);
  const seen = new Set<string>();
  const params: { atd: string[] }[] = [];

  for (const path of index.paths) {
    for (const selection of selectionsForPath(path)) {
      const segments = atdSelectionSegments(selection, lookup);
      if (segments.length === 0) {
        continue;
      }
      const key = segments.join("\u001f");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      params.push({ atd: segments });
    }
  }

  return params;
}

export function parseAtdFilterIndex(value: unknown): AtdFilterIndex {
  if (!isAtdFilterIndex(value)) {
    throw new Error("atdFilters.json is not an ATD filter index");
  }
  return value;
}

function atdSelectionFromSegments(
  segments: string[],
  lookup: AtdSlugLookup,
): AtdFilterSelection {
  const selection: AtdFilterSelection = { ...EMPTY_ATD_FILTER_SELECTION };
  let nextLevel = 0;

  for (const segment of segments) {
    const match = ATD_LEVELS.slice(nextLevel).find((level) =>
      lookup.nameBySlug[level].has(segment),
    );
    if (!match) {
      continue;
    }
    const name = lookup.nameBySlug[match].get(segment);
    if (!name) {
      continue;
    }
    selection[match] = name;
    nextLevel = ATD_LEVELS.indexOf(match) + 1;
  }

  return selection;
}

function selectionsForPath(path: AtdPath): AtdFilterSelection[] {
  const gubernia = path.gubernia || null;
  const uezd = path.uezd || null;
  const volost = path.volost || null;

  return [
    { gubernia, uezd: null, volost: null },
    { gubernia, uezd, volost: null },
    { gubernia, uezd, volost },
    { gubernia: null, uezd, volost: null },
    { gubernia: null, uezd, volost },
    { gubernia: null, uezd: null, volost },
    { gubernia, uezd: null, volost },
  ];
}

function decodeAtdSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return decodeURIComponent(trimmed).trim();
  } catch {
    return trimmed;
  }
}

function isAtdFilterIndex(value: unknown): value is AtdFilterIndex {
  return (
    typeof value === "object" &&
    value !== null &&
    "paths" in value &&
    Array.isArray(value.paths) &&
    value.paths.every(isAtdPath)
  );
}

function isAtdPath(value: unknown): value is AtdPath {
  return (
    typeof value === "object" &&
    value !== null &&
    "gubernia" in value &&
    "uezd" in value &&
    "volost" in value &&
    typeof value.gubernia === "string" &&
    typeof value.uezd === "string" &&
    typeof value.volost === "string"
  );
}
