import type { PlaceItem } from "./types";

export type AtdPath = {
  gubernia: string;
  uezd: string;
  volost: string;
};

export type AtdFilterSelection = {
  gubernia: string | null;
  uezd: string | null;
  volost: string | null;
};

export type AtdFilterIndex = {
  paths: AtdPath[];
};

export type AtdFilterOptions = {
  gubernias: string[];
  uezds: string[];
  volosts: string[];
};

export const EMPTY_ATD_FILTER_SELECTION: AtdFilterSelection = {
  gubernia: null,
  uezd: null,
  volost: null,
};

export const ATD_LEVELS = ["gubernia", "uezd", "volost"] as const;

export type AtdLevel = (typeof ATD_LEVELS)[number];

export const ATD_PATH_SEP = "\u001f";

const ATD_LEVEL_SUFFIX: Record<AtdLevel, RegExp> = {
  gubernia: /губерния$/i,
  uezd: /уезд$/i,
  volost: /волость$/i,
};

export function atdLevelOf(name: string): AtdLevel | null {
  for (const level of ATD_LEVELS) {
    if (ATD_LEVEL_SUFFIX[level].test(name)) {
      return level;
    }
  }
  return null;
}

function normalizePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function withoutYearPrefix(year: string, value: string): string {
  const prefix = `${year}:`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export function parseAtdPath(year: string, value: string): AtdPath | null {
  const body = withoutYearPrefix(year, value);
  const path: AtdPath = { gubernia: "", uezd: "", volost: "" };

  for (const part of body.split(";")) {
    const text = normalizePart(part);
    if (!text) {
      continue;
    }
    const level = atdLevelOf(text);
    if (!level || path[level]) {
      continue;
    }
    path[level] = text;
  }

  if (!path.gubernia && !path.uezd && !path.volost) {
    return null;
  }

  return path;
}

export function collectAtdPaths(atd: Record<string, string>): AtdPath[] {
  const paths: AtdPath[] = [];
  const seen = new Set<string>();

  for (const [year, value] of Object.entries(atd)) {
    const path = parseAtdPath(year, value);
    if (!path) {
      continue;
    }
    const key = pathKey(path);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    paths.push(path);
  }

  return paths;
}

export function pathKey(path: AtdPath): string {
  return `${path.gubernia}${ATD_PATH_SEP}${path.uezd}${ATD_PATH_SEP}${path.volost}`;
}

export function parsePathKey(key: string): AtdPath {
  const [gubernia = "", uezd = "", volost = ""] = key.split(ATD_PATH_SEP);
  return { gubernia, uezd, volost };
}

function compareLocale(a: string, b: string): number {
  return a.localeCompare(b, "ru");
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].filter(Boolean).sort(compareLocale);
}

export function buildAtdFilterIndex(places: PlaceItem[]): AtdFilterIndex {
  const seen = new Set<string>();
  const paths: AtdPath[] = [];

  for (const place of places) {
    if (
      place.lat == null ||
      place.lng == null ||
      !Number.isFinite(place.lat) ||
      !Number.isFinite(place.lng)
    ) {
      continue;
    }

    for (const path of collectAtdPaths(place.atd)) {
      const key = pathKey(path);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      paths.push(path);
    }
  }

  paths.sort((a, b) => {
    return (
      compareLocale(a.gubernia, b.gubernia) ||
      compareLocale(a.uezd, b.uezd) ||
      compareLocale(a.volost, b.volost)
    );
  });

  return { paths };
}

export function pathMatchesSelection(
  path: AtdPath,
  selection: AtdFilterSelection,
): boolean {
  if (selection.gubernia && path.gubernia !== selection.gubernia) {
    return false;
  }
  if (selection.uezd && path.uezd !== selection.uezd) {
    return false;
  }
  if (selection.volost && path.volost !== selection.volost) {
    return false;
  }
  return true;
}

export function featurePathsMatch(
  paths: string[] | undefined,
  selection: AtdFilterSelection,
): boolean {
  if (!selection.gubernia && !selection.uezd && !selection.volost) {
    return true;
  }
  if (!paths || paths.length === 0) {
    return false;
  }
  return paths.some((key) =>
    pathMatchesSelection(parsePathKey(key), selection),
  );
}

export function atdFilterOptions(
  index: AtdFilterIndex,
  selection: AtdFilterSelection,
): AtdFilterOptions {
  const gubernias = uniqueSorted(index.paths.map((path) => path.gubernia));

  const uezds = uniqueSorted(
    index.paths
      .filter(
        (path) => !selection.gubernia || path.gubernia === selection.gubernia,
      )
      .map((path) => path.uezd),
  );

  const volosts = uniqueSorted(
    index.paths
      .filter(
        (path) =>
          (!selection.gubernia || path.gubernia === selection.gubernia) &&
          (!selection.uezd || path.uezd === selection.uezd),
      )
      .map((path) => path.volost),
  );

  return { gubernias, uezds, volosts };
}

export function constrainAtdSelection(
  index: AtdFilterIndex,
  selection: AtdFilterSelection,
): AtdFilterSelection {
  const options = atdFilterOptions(index, {
    gubernia: selection.gubernia,
    uezd: null,
    volost: null,
  });

  const gubernia =
    selection.gubernia && options.gubernias.includes(selection.gubernia)
      ? selection.gubernia
      : null;

  const afterGubernia = atdFilterOptions(index, {
    gubernia,
    uezd: null,
    volost: null,
  });
  const uezd =
    selection.uezd && afterGubernia.uezds.includes(selection.uezd)
      ? selection.uezd
      : null;

  const afterUezd = atdFilterOptions(index, {
    gubernia,
    uezd,
    volost: null,
  });
  const volost =
    selection.volost && afterUezd.volosts.includes(selection.volost)
      ? selection.volost
      : null;

  return { gubernia, uezd, volost };
}

export function hasAtdFilterSelection(selection: AtdFilterSelection): boolean {
  return Boolean(selection.gubernia || selection.uezd || selection.volost);
}
