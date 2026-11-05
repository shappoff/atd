export const SITE_BRAND = "shappoff";
export const ROOT_TITLE = "Административно-территориальное деление";

const CHILD_SUFFIX = ` — АТД — ${SITE_BRAND}`;
const ROOT_SUFFIX = ` — ${SITE_BRAND}`;

export const SITE_TITLE_TEMPLATE = `%s${CHILD_SUFFIX}`;
export const DEFAULT_TITLE = `${ROOT_TITLE}${ROOT_SUFFIX}`;

export function routeTitle(title: string, root: boolean): string {
  return `${title}${root ? ROOT_SUFFIX : CHILD_SUFFIX}`;
}
