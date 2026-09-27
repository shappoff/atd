"use client";

import { useMapLibreMap } from "@shappoff/ui/map";
import { useEffect } from "react";
import {
  attachPlacesClusterInteractions,
  mountPlacesCluster,
  unmountPlacesCluster,
} from "./placesCluster";

type PlacesClusterLayerProps = {
  dataUrl: string;
};

export function PlacesClusterLayer({ dataUrl }: PlacesClusterLayerProps) {
  const map = useMapLibreMap();

  useEffect(() => {
    mountPlacesCluster(map, dataUrl);
    const detach = attachPlacesClusterInteractions(map);
    return () => {
      detach();
      unmountPlacesCluster(map);
    };
  }, [map, dataUrl]);

  return null;
}
