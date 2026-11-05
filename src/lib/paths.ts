export const ATD_FILTERS_PUBLIC_PATH = "/atdFilters.json";
export const ATD_PLACES_PUBLIC_PATH = "/atdPlaces.geojson";

const basePath = process.env.PAGES_BASE_PATH ?? "";
const siteOrigin = (
  process.env.SITE_ORIGIN ?? "https://shappoff.github.io"
).replace(/\/+$/, "");

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function absoluteUrl(path: string): string {
  return new URL(withBasePath(path), `${siteOrigin}/`).href;
}

export const SITE_ORIGIN = siteOrigin;
