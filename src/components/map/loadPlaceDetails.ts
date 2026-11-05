import { get, ref } from "firebase/database";
import { getPlacesDatabase } from "@/lib/firebase";
import {
  type PlaceDetails,
  parsePlaceDetails,
  placeDetailsPath,
} from "@/prebuild/placeDetails";

export async function loadPlaceDetails(row: number): Promise<PlaceDetails> {
  const snapshot = await get(ref(getPlacesDatabase(), placeDetailsPath(row)));
  const details = parsePlaceDetails(snapshot.val());
  if (!details || details.row !== row) {
    throw new Error(`Place ${row} is missing`);
  }

  return details;
}
