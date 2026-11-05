import { readFileSync } from "node:fs";
import { join } from "node:path";
import { atdStaticParams, parseAtdFilterIndex } from "@/lib/atdRoute";
import { ATD_FILTERS_PUBLIC_PATH } from "@/lib/paths";

export const dynamicParams = false;

export function generateStaticParams() {
  const relative = ATD_FILTERS_PUBLIC_PATH.replace(/^\/+/, "");
  const filePath = join(process.cwd(), "public", relative);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Failed to read ${filePath}: ${message}`);
  }
  return atdStaticParams(parseAtdFilterIndex(raw));
}

export default function Page() {
  return null;
}
