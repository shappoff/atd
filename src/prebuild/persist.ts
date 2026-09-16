import fs from "node:fs";
import path from "node:path";
import type { PlaceItem } from "./types";

const atdPlacesPath = path.join(process.cwd(), "public", "atdPlaces.json");

export function persistPlaces(places: PlaceItem[]): string {
  fs.mkdirSync(path.dirname(atdPlacesPath), { recursive: true });
  fs.writeFileSync(atdPlacesPath, `${JSON.stringify(places)}\n`, "utf8");
  return atdPlacesPath;
}
