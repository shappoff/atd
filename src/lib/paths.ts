export const ATD_FILTERS_PUBLIC_PATH = "/atdFilters.json";

const basePath = process.env.PAGES_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
