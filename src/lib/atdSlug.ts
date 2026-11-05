import {
  ATD_LEVELS,
  type AtdFilterIndex,
  type AtdLevel,
} from "@/prebuild/atdHierarchy";

const ATD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  let latin = "";
  for (const char of name.toLocaleLowerCase("ru")) {
    latin += CYRILLIC_TO_LATIN[char] ?? char;
  }
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildAtdSlugLookup(index: AtdFilterIndex): AtdSlugLookup {
  const slugByName = emptyLevelMaps();
  const nameBySlug = emptyLevelMaps();

  for (const level of ATD_LEVELS) {
    const names = new Set<string>();
    for (const path of index.paths) {
      const name = path[level];
      if (name) {
        names.add(name);
      }
    }
    for (const [name, slug] of uniqueSlugs(names)) {
      if (!ATD_SLUG_PATTERN.test(slug)) {
        throw new Error(`ATD slug is not a latin URL segment: ${slug}`);
      }
      slugByName[level].set(name, slug);
      nameBySlug[level].set(slug, name);
    }
  }

  return { slugByName, nameBySlug };
}

function uniqueSlugs(names: Iterable<string>): Map<string, string> {
  const byBase = new Map<string, string[]>();
  for (const name of names) {
    const base = slugifyAtdName(name);
    if (!base) {
      continue;
    }
    const group = byBase.get(base);
    if (group) {
      group.push(name);
    } else {
      byBase.set(base, [name]);
    }
  }

  const used = new Set<string>();
  const slugByName = new Map<string, string>();
  const collisions: [string, string[]][] = [];

  for (const [base, group] of byBase) {
    if (group.length === 1) {
      used.add(base);
      slugByName.set(group[0], base);
      continue;
    }
    collisions.push([base, group]);
  }

  for (const [base, group] of collisions) {
    group.sort((left, right) => left.localeCompare(right, "ru"));
    let suffix = 2;
    for (const name of group) {
      let slug = base;
      if (used.has(slug)) {
        while (used.has(`${base}-${suffix}`)) {
          suffix += 1;
        }
        slug = `${base}-${suffix}`;
        suffix += 1;
      }
      used.add(slug);
      slugByName.set(name, slug);
    }
  }

  return slugByName;
}

function emptyLevelMaps(): Record<AtdLevel, Map<string, string>> {
  return {
    gubernia: new Map(),
    uezd: new Map(),
    volost: new Map(),
  };
}
