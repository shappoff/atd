import {
  ATD_LEVELS,
  type AtdFilterIndex,
  type AtdLevel,
} from "@/prebuild/atdHierarchy";

const ATD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ATD_LEVEL_WORD = /губерния|уезд|волость/g;
const ATD_LEVEL_SLUG = /(?:^|-)(?:guberniya|uezd|volost)(?:-|$)/;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export type AtdSlugLookup = {
  slugByName: Record<AtdLevel, ReadonlyMap<string, string>>;
  nameBySlug: Record<AtdLevel, ReadonlyMap<string, string>>;
};

export function slugifyAtdName(name: string): string {
  const withoutLevel = name
    .toLocaleLowerCase("ru")
    .replace(ATD_LEVEL_WORD, " ");
  let latin = "";
  for (const char of withoutLevel) {
    latin += CYRILLIC_TO_LATIN[char] ?? char;
  }
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

type AtdNamedPlace = {
  level: AtdLevel;
  name: string;
};

export function buildAtdSlugLookup(index: AtdFilterIndex): AtdSlugLookup {
  const slugByName = emptyLevelMaps();
  const nameBySlug = emptyLevelMaps();
  const places: AtdNamedPlace[] = [];
  const seen = new Set<string>();

  for (const level of ATD_LEVELS) {
    for (const path of index.paths) {
      const name = path[level];
      if (!name) {
        continue;
      }
      const key = `${level}\u0000${name}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      places.push({ level, name });
    }
  }

  for (const [level, name, slug] of uniqueSlugs(places)) {
    if (!ATD_SLUG_PATTERN.test(slug) || ATD_LEVEL_SLUG.test(slug)) {
      throw new Error(`ATD slug is not a latin URL segment: ${slug}`);
    }
    slugByName[level].set(name, slug);
    nameBySlug[level].set(slug, name);
  }

  return { slugByName, nameBySlug };
}

function uniqueSlugs(
  places: readonly AtdNamedPlace[],
): [AtdLevel, string, string][] {
  const byBase = new Map<string, AtdNamedPlace[]>();
  for (const place of places) {
    const base = slugifyAtdName(place.name);
    if (!base) {
      continue;
    }
    const group = byBase.get(base);
    if (group) {
      group.push(place);
    } else {
      byBase.set(base, [place]);
    }
  }

  const used = new Set<string>();
  const assigned: [AtdLevel, string, string][] = [];
  const collisions: [string, AtdNamedPlace[]][] = [];

  for (const [base, group] of byBase) {
    if (group.length === 1) {
      used.add(base);
      const place = group[0];
      assigned.push([place.level, place.name, base]);
      continue;
    }
    collisions.push([base, group]);
  }

  for (const [base, group] of collisions) {
    group.sort(comparePlaces);
    let suffix = 2;
    for (const place of group) {
      let slug = base;
      if (used.has(slug)) {
        while (used.has(`${base}-${suffix}`)) {
          suffix += 1;
        }
        slug = `${base}-${suffix}`;
        suffix += 1;
      }
      used.add(slug);
      assigned.push([place.level, place.name, slug]);
    }
  }

  return assigned;
}

function comparePlaces(left: AtdNamedPlace, right: AtdNamedPlace): number {
  const level =
    ATD_LEVELS.indexOf(left.level) - ATD_LEVELS.indexOf(right.level);
  if (level !== 0) {
    return level;
  }
  return left.name.localeCompare(right.name, "ru");
}

function emptyLevelMaps(): Record<AtdLevel, Map<string, string>> {
  return {
    gubernia: new Map(),
    uezd: new Map(),
    volost: new Map(),
  };
}
