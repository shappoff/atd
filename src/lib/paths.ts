import { placeShardName } from "@/prebuild/placeDetails";

const basePath = process.env.PAGES_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function placeDetailsUrl(placesUrl: string, row: number): string {
  const slash = placesUrl.lastIndexOf("/");
  const directory = slash >= 0 ? placesUrl.slice(0, slash) : "";
  return `${directory}/places/${placeShardName(row)}`;
}
