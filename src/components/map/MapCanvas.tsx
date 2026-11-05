"use client";

import { MapLibreMap } from "@shappoff/ui/map";
import { type ReactNode, useState } from "react";
import {
  type AtdFilterSelection,
  EMPTY_ATD_FILTER_SELECTION,
} from "@/prebuild/atdHierarchy";
import "maplibre-gl/dist/maplibre-gl.css";
import { PlacesClusterLayer } from "./PlacesClusterLayer";
import { PlacesFilterPanel } from "./PlacesFilterPanel";

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
  const [filter, setFilter] = useState<AtdFilterSelection>(
    EMPTY_ATD_FILTER_SELECTION,
  );

  return (
    <MapLibreMap ariaLabel={MAP_ARIA_LABEL} workerUrl={workerUrl}>
      <PlacesFilterPanel
        filtersUrl={filtersUrl}
        value={filter}
        onChange={setFilter}
      />
      <PlacesClusterLayer dataUrl={placesUrl} filter={filter} />
      {children}
    </MapLibreMap>
  );
}
