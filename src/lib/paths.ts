export const ATD_FILTERS_PUBLIC_PATH = "/atdFilters.json";
export const ATD_PLACES_PUBLIC_PATH = "/atdPlaces.geojson";
export const ATD_UNLOCATED_PUBLIC_PATH = "/atdUnlocated.json";

const basePath = process.env.PAGES_BASE_PATH ?? "";
const publicSite = new URL(
  `${(process.env.SITE_ORIGIN ?? "https://shappoff.github.io/atd").replace(/\/+$/, "")}/`,
);

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function absoluteUrl(path: string): string {
  const relative = path.startsWith("/") ? path.slice(1) : path;
  return new URL(relative, publicSite).href;
}
