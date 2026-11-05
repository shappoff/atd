"use client";

import { MapLibreMap } from "@shappoff/ui/map";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { PlacesClusterLayer } from "./PlacesClusterLayer";
import { PlacesFilterPanel } from "./PlacesFilterPanel";
import { useAtdFilterIndex } from "./useAtdFilterIndex";
import { useAtdFilterRoute } from "./useAtdFilterRoute";

const MAP_ARIA_LABEL = "Карта Беларуси";

type MapCanvasProps = {
  workerUrl: string;
  placesUrl: string;
  filtersUrl: string;
  children?: ReactNode;
};

export function MapCanvas({
  workerUrl,
  placesUrl,
  filtersUrl,
  children,
}: MapCanvasProps) {
  const index = useAtdFilterIndex(filtersUrl);
  const { selection, ready, onChange } = useAtdFilterRoute(index);

  return (
    <MapLibreMap ariaLabel={MAP_ARIA_LABEL} workerUrl={workerUrl}>
      <PlacesFilterPanel index={index} value={selection} onChange={onChange} />
      <PlacesClusterLayer
        dataUrl={placesUrl}
        filter={selection}
        active={ready}
      />
      {children}
    </MapLibreMap>
  );
}
