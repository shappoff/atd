"use client";

import { MapLibreMap } from "@shappoff/ui/map";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { PlacesClusterLayer } from "./PlacesClusterLayer";

const MAP_ARIA_LABEL = "Карта Беларуси";

type MapCanvasProps = {
  workerUrl: string;
  placesUrl: string;
  children?: ReactNode;
};

export function MapCanvas({ workerUrl, placesUrl, children }: MapCanvasProps) {
  return (
    <MapLibreMap ariaLabel={MAP_ARIA_LABEL} workerUrl={workerUrl}>
      <PlacesClusterLayer dataUrl={placesUrl} />
      {children}
    </MapLibreMap>
  );
}
