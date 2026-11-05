import type { Metadata } from "next";
import { cache } from "react";
import {
  getAtdFilterIndex,
  getAtdPlacesByPath,
  getAtdSlugLookup,
} from "@/lib/atdData";
import { atdSelectionFromPathname, atdSelectionPath } from "@/lib/atdRoute";
import { absoluteUrl } from "@/lib/paths";
import { ROOT_TITLE, routeTitle } from "@/lib/siteTitle";
import {
  ATD_LEVELS,
  type AtdFilterSelection,
  type AtdLevel,
  atdFilterOptions,
  EMPTY_ATD_FILTER_SELECTION,
  pathKey,
  pathMatchesSelection,
} from "@/prebuild/atdHierarchy";

const UNTITLED_PLACE_TYPE = "тип не указан";

const LIST_HEADING: Record<AtdLevel | "place", string> = {
  gubernia: "Губернии",
  uezd: "Уезды",
  volost: "Волости",
  place: "Населённые пункты",
};

const COUNT_FORMS: Record<
  AtdLevel | "place",
  readonly [string, string, string]
> = {
  gubernia: ["губерния", "губернии", "губерний"],
  uezd: ["уезд", "уезда", "уездов"],
  volost: ["волость", "волости", "волостей"],
  place: ["населённый пункт", "населённых пункта", "населённых пунктов"],
};

export type AtdSeoLink = {
  label: string;
  href?: string;
};

export type AtdSeoCrumb = {
  label: string;
  href: string;
};

export type AtdSeoDocument = {
  title: string;
  description: string;
  heading: string;
  breadcrumbs: AtdSeoCrumb[];
  items: AtdSeoLink[];
};

export function atdPageMetadata(segments: readonly string[]): Metadata {
  const document = loadAtdSeoDocument(segments.join("/"));
  const path = atdSelectionPath(
    selectionFromSegments(segments),
    getAtdSlugLookup(),
  );
  const title = routeTitle(document.title, segments.length === 0);
  return {
    title: { absolute: title },
    description: document.description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: document.description,
      url: path,
    },
  };
}

export const loadAtdSeoDocument = cache(
  (segmentsKey: string): AtdSeoDocument => {
    const segments = segmentsKey ? segmentsKey.split("/") : [];
    return buildAtdSeoDocument(selectionFromSegments(segments));
  },
);

function selectionFromSegments(
  segments: readonly string[],
): AtdFilterSelection {
  if (segments.length === 0) {
    return EMPTY_ATD_FILTER_SELECTION;
  }
  return atdSelectionFromPathname(
    `/${segments.join("/")}/`,
    getAtdSlugLookup(),
  );
}

function buildAtdSeoDocument(selection: AtdFilterSelection): AtdSeoDocument {
  const lookup = getAtdSlugLookup();
  const title = selectionTitle(selection);
  const level = listLevel(selection);
  const heading = LIST_HEADING[level];
  const items =
    level === "place" ? placeItems(selection) : divisionItems(selection, level);
  const total = `Всего ${countPhrase(items.length, level)}.`;
  const description =
    title === ROOT_TITLE
      ? `Карта губерний, уездов, волостей и населённых пунктов. ${total}`
      : `${heading} — ${title}. ${total}`;

  return {
    title,
    description,
    heading,
    breadcrumbs: breadcrumbs(selection, lookup),
    items,
  };
}

function selectionTitle(selection: AtdFilterSelection): string {
  const parts = [selection.volost, selection.uezd, selection.gubernia].filter(
    (part): part is string => Boolean(part),
  );
  if (parts.length === 0) {
    return ROOT_TITLE;
  }
  return parts.join(", ");
}

function countPhrase(count: number, level: AtdLevel | "place"): string {
  const [one, few, many] = COUNT_FORMS[level];
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) {
    return `${count} ${many}`;
  }
  if (mod10 === 1) {
    return `${count} ${one}`;
  }
  if (mod10 > 1 && mod10 < 5) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

function listLevel(selection: AtdFilterSelection): AtdLevel | "place" {
  if (selection.volost) {
    return "place";
  }
  if (selection.uezd) {
    return "volost";
  }
  if (selection.gubernia) {
    return "uezd";
  }
  return "gubernia";
}

function divisionItems(
  selection: AtdFilterSelection,
  level: AtdLevel,
): AtdSeoLink[] {
  const lookup = getAtdSlugLookup();
  const parentPath = atdSelectionPath(selection, lookup);
  const options = atdFilterOptions(getAtdFilterIndex(), selection);
  const names =
    level === "gubernia"
      ? options.gubernias
      : level === "uezd"
        ? options.uezds
        : options.volosts;

  return names.flatMap((name) => {
    const href = atdSelectionPath(withLevel(selection, level, name), lookup);
    if (href === parentPath) {
      return [];
    }
    return [{ label: name, href }];
  });
}

function withLevel(
  selection: AtdFilterSelection,
  level: AtdLevel,
  name: string,
): AtdFilterSelection {
  if (level === "gubernia") {
    return { gubernia: name, uezd: null, volost: null };
  }
  if (level === "uezd") {
    return { ...selection, uezd: name, volost: null };
  }
  return { ...selection, volost: name };
}

function placeItems(selection: AtdFilterSelection): AtdSeoLink[] {
  const places = getAtdPlacesByPath();
  const labels = new Map<string, AtdSeoLink>();

  for (const path of getAtdFilterIndex().paths) {
    if (!pathMatchesSelection(path, selection)) {
      continue;
    }
    for (const place of places.get(pathKey(path)) ?? []) {
      const label = placeLabel(place.title, place.type);
      labels.set(label, { label });
    }
  }

  return [...labels.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "ru"),
  );
}

function placeLabel(title: string, type: string): string {
  if (!type || type === UNTITLED_PLACE_TYPE) {
    return title;
  }
  return `${title}, ${type}`;
}

function breadcrumbs(
  selection: AtdFilterSelection,
  lookup: ReturnType<typeof getAtdSlugLookup>,
): AtdSeoCrumb[] {
  const crumbs: AtdSeoCrumb[] = [{ label: "Карта", href: "/" }];
  const current: AtdFilterSelection = { ...EMPTY_ATD_FILTER_SELECTION };

  for (const level of ATD_LEVELS) {
    const name = selection[level];
    if (!name) {
      continue;
    }
    current[level] = name;
    crumbs.push({
      label: name,
      href: atdSelectionPath(current, lookup),
    });
  }

  return crumbs;
}

export function atdSeoJsonLd(document: AtdSeoDocument): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: document.title,
    description: document.description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: document.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: absoluteUrl(crumb.href),
      })),
    },
    mainEntity: {
      "@type": "ItemList",
      name: document.heading,
      numberOfItems: document.items.length,
      itemListElement: document.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(item.href ? { url: absoluteUrl(item.href) } : {}),
      })),
    },
  };

  return JSON.stringify(data);
}
