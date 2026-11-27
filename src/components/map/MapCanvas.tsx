"use client";

import {
  MapLibreMap,
  type TileLayerId,
  useMapLibreMap,
} from "@shappoff/ui/map";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AlgoliaPlaceSearchHit } from "@/prebuild/algoliaPlaces";
import { BasemapSelect } from "./BasemapSelect";
import { PlacesClusterLayer } from "./PlacesClusterLayer";
import { PlacesFilterPanel } from "./PlacesFilterPanel";
import { PlacesSearchPanel } from "./PlacesSearchPanel";
import { useAtdFilterIndex } from "./useAtdFilterIndex";
import { useAtdFilterRoute } from "./useAtdFilterRoute";

const MAP_ARIA_LABEL = "Карта Беларуси";

type MapCanvasProps = {
  workerUrl: string;
  placesUrl: string;
  filtersUrl: string;
  children?: ReactNode;
};

function FreeMapBounds() {
  const map = useMapLibreMap();

  useEffect(() => {
    map.setMaxBounds(null);
    map.setMinZoom(null);
  }, [map]);

  return null;
}

export function MapCanvas({
  workerUrl,
  placesUrl,
  filtersUrl,
  children,
}: MapCanvasProps) {
  const index = useAtdFilterIndex(filtersUrl);
  const { selection, ready, onChange } = useAtdFilterRoute(index);
  const [basemap, setBasemap] = useState<TileLayerId>("osm");
  const [searchResults, setSearchResults] = useState<
    AlgoliaPlaceSearchHit[] | null
  >(null);
  const searchResultIds = useMemo(
    () => searchResults?.map((place) => place.row) ?? null,
    [searchResults],
  );

  return (
    <MapLibreMap
      ariaLabel={MAP_ARIA_LABEL}
      workerUrl={workerUrl}
      basemap={basemap}
      onBasemapChange={setBasemap}
    >
      <FreeMapBounds />
      <BasemapSelect value={basemap} onChange={setBasemap} />
      <PlacesFilterPanel
        index={index}
        value={selection}
        onChange={onChange}
        search={
          <PlacesSearchPanel
            index={index}
            filter={selection}
            onResultsChange={setSearchResults}
          />
        }
      />
      <PlacesClusterLayer
        dataUrl={placesUrl}
        filter={selection}
        active={ready}
        searchResultIds={searchResultIds}
      />
      {children}
    </MapLibreMap>
  );
}
