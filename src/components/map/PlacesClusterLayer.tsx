"use client";

import { useMapLibreMap } from "@shappoff/ui/map";
import { useEffect, useState } from "react";
import type { AtdFilterSelection } from "@/prebuild/atdHierarchy";
import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";
import { filterPlacesGeoJson } from "./filterPlacesGeoJson";
import { loadPlaceDetails } from "./loadPlaceDetails";
import { PlaceDrawer, type PlaceDrawerState } from "./PlaceDrawer";
import {
  attachPlacesClusterInteractions,
  mountPlacesCluster,
  setPlacesClusterData,
  unmountPlacesCluster,
} from "./placesCluster";

type PlacesClusterLayerProps = {
  dataUrl: string;
  filter: AtdFilterSelection;
  active: boolean;
};

export function PlacesClusterLayer({
  dataUrl,
  filter,
  active,
}: PlacesClusterLayerProps) {
  const map = useMapLibreMap();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<PlaceDrawerState | null>(null);
  const [geojson, setGeojson] = useState<PlacesGeoJson | null>(null);

  useEffect(() => {
    let alive = true;

    void fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load places: ${response.status}`);
        }
        return response.json() as Promise<PlacesGeoJson>;
      })
      .then((data) => {
        if (alive) {
          setGeojson(data);
        }
      })
      .catch(() => {
        if (alive) {
          setGeojson({ type: "FeatureCollection", features: [] });
        }
      });

    return () => {
      alive = false;
    };
  }, [dataUrl]);

  useEffect(() => {
    if (!active || !geojson) {
      return;
    }

    let alive = true;
    let request = 0;

    mountPlacesCluster(map, geojson);
    const detach = attachPlacesClusterInteractions(map, (hit) => {
      const current = ++request;
      setPlace({
        title: hit.title,
        type: hit.type,
        details: null,
        error: false,
      });
      setOpen(true);

      void loadPlaceDetails(hit.id)
        .then((details) => {
          if (!alive || current !== request) {
            return;
          }
          setPlace({
            title: details.title,
            type: details.type,
            details,
            error: false,
          });
        })
        .catch(() => {
          if (!alive || current !== request) {
            return;
          }
          setPlace({
            title: hit.title,
            type: hit.type,
            details: null,
            error: true,
          });
        });
    });

    return () => {
      alive = false;
      detach();
      unmountPlacesCluster(map);
    };
  }, [active, map, geojson]);

  useEffect(() => {
    if (!active || !geojson) {
      return;
    }
    setPlacesClusterData(map, filterPlacesGeoJson(geojson, filter));
  }, [active, map, geojson, filter]);

  return (
    <PlaceDrawer
      open={open}
      place={place}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) {
          setPlace(null);
        }
      }}
    />
  );
}
