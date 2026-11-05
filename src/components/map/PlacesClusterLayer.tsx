"use client";

import { useMapLibreMap } from "@shappoff/ui/map";
import { useEffect, useRef, useState } from "react";
import {
  type AtdFilterSelection,
  hasAtdFilterSelection,
} from "@/prebuild/atdHierarchy";
import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";
import { filterPlacesGeoJson } from "./filterPlacesGeoJson";
import { loadPlaceDetails } from "./loadPlaceDetails";
import { readPlacesGeoJson } from "./loadPlacesGeoJson";
import { PlaceDrawer, type PlaceDrawerState } from "./PlaceDrawer";
import { PlacesLoadProgress } from "./PlacesLoadProgress";
import {
  attachPlacesClusterInteractions,
  framePlaces,
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
  const [progress, setProgress] = useState<number | null>(null);
  const framedFilter = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    readPlacesGeoJson(dataUrl, controller.signal, (value) => {
      if (alive) {
        setProgress(value);
      }
    })
      .then((data) => {
        if (alive) {
          setGeojson(data);
        }
      })
      .catch((error: unknown) => {
        if (!alive || isAbortError(error)) {
          return;
        }
        setGeojson({ type: "FeatureCollection", features: [] });
      });

    return () => {
      alive = false;
      controller.abort();
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
    const places = filterPlacesGeoJson(geojson, filter);
    setPlacesClusterData(map, places);

    const key = [filter.gubernia, filter.uezd, filter.volost].join("\0");
    if (framedFilter.current === key) {
      return;
    }
    if (!hasAtdFilterSelection(filter) && framedFilter.current == null) {
      framedFilter.current = key;
      return;
    }
    framedFilter.current = key;
    framePlaces(map, places);
  }, [active, map, geojson, filter]);

  return (
    <>
      {geojson == null ? <PlacesLoadProgress value={progress} /> : null}
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
    </>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
