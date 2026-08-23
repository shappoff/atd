"use client";

import { MapLibreMap } from "@shappoff/ui/map";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_ARIA_LABEL = "Карта Беларуси";

type MapCanvasProps = {
  workerUrl: string;
  children?: ReactNode;
};

export function MapCanvas({ workerUrl, children }: MapCanvasProps) {
  return (
    <MapLibreMap ariaLabel={MAP_ARIA_LABEL} workerUrl={workerUrl}>
      {children}
    </MapLibreMap>
  );
}
