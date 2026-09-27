import type {
  GeoJSONSource,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  Map as MapLibreGlMap,
  Popup,
} from "maplibre-gl";
import { Popup as MapLibrePopup } from "maplibre-gl";

export const PLACES_SOURCE_ID = "atd-places";
export const PLACES_CLUSTER_LAYER_ID = "atd-places-clusters";
export const PLACES_CLUSTER_COUNT_LAYER_ID = "atd-places-cluster-count";
export const PLACES_POINT_LAYER_ID = "atd-places-points";

const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 52;
const GLYPHS_URL =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";
const FALLBACK_PRIMARY = "#0f766e";

function themeColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function featureLngLat(feature: MapGeoJSONFeature): [number, number] | null {
  const { geometry } = feature;
  if (geometry.type !== "Point") {
    return null;
  }
  return geometry.coordinates as [number, number];
}

function popupHtml(feature: MapGeoJSONFeature): string {
  const title = escapeHtml(String(feature.properties?.title ?? ""));
  const type = String(feature.properties?.type ?? "").trim();
  const titleHtml = `<p class="sui-map-marker__popup-title">${title}</p>`;
  if (!type) {
    return titleHtml;
  }
  return `${titleHtml}<p class="sui-map-marker__popup-description">${escapeHtml(type)}</p>`;
}

function placesSource(dataUrl: string) {
  return {
    type: "geojson" as const,
    data: dataUrl,
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_RADIUS,
  };
}

export function mountPlacesCluster(map: MapLibreGlMap, dataUrl: string): void {
  map.setGlyphs(GLYPHS_URL);

  if (!map.getSource(PLACES_SOURCE_ID)) {
    map.addSource(PLACES_SOURCE_ID, placesSource(dataUrl));
  }

  const primary = themeColor("--sui-color-primary", FALLBACK_PRIMARY);

  if (!map.getLayer(PLACES_CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: PLACES_CLUSTER_LAYER_ID,
      type: "circle",
      source: PLACES_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#99f6e4",
          25,
          "#2dd4bf",
          100,
          primary,
          750,
          "#134e4a",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          16,
          25,
          22,
          100,
          28,
          750,
          36,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  if (!map.getLayer(PLACES_CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: PLACES_CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: PLACES_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Regular"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
      interactive: false,
    });
  }

  if (!map.getLayer(PLACES_POINT_LAYER_ID)) {
    map.addLayer({
      id: PLACES_POINT_LAYER_ID,
      type: "circle",
      source: PLACES_SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": primary,
        "circle-radius": 5,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

export function unmountPlacesCluster(map: MapLibreGlMap): void {
  for (const layerId of [
    PLACES_CLUSTER_COUNT_LAYER_ID,
    PLACES_CLUSTER_LAYER_ID,
    PLACES_POINT_LAYER_ID,
  ]) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  if (map.getSource(PLACES_SOURCE_ID)) {
    map.removeSource(PLACES_SOURCE_ID);
  }
}

function placesGeoJsonSource(map: MapLibreGlMap): GeoJSONSource | null {
  const source = map.getSource(PLACES_SOURCE_ID);
  if (source?.type !== "geojson") {
    return null;
  }
  return source;
}

export function attachPlacesClusterInteractions(
  map: MapLibreGlMap,
): () => void {
  const popup: Popup = new MapLibrePopup({
    closeButton: true,
    offset: 12,
    maxWidth: "280px",
  });
  const canvas = map.getCanvas();

  const expandCluster = (feature: MapGeoJSONFeature) => {
    const clusterId = Number(feature.properties?.cluster_id);
    const source = placesGeoJsonSource(map);
    const center = featureLngLat(feature);
    if (!Number.isFinite(clusterId) || !source || !center) {
      return;
    }

    void source
      .getClusterExpansionZoom(clusterId)
      .then((zoom) => {
        map.easeTo({ center, zoom });
      })
      .catch(() => {
        map.easeTo({ center, zoom: map.getZoom() + 2 });
      });
  };

  const showPlacePopup = (feature: MapGeoJSONFeature) => {
    const center = featureLngLat(feature);
    if (!center) {
      return;
    }
    popup.setLngLat(center).setHTML(popupHtml(feature)).addTo(map);
  };

  const onMapClick = (event: MapLayerMouseEvent) => {
    const clusters = map.queryRenderedFeatures(event.point, {
      layers: [PLACES_CLUSTER_LAYER_ID],
    });
    if (clusters[0]) {
      expandCluster(clusters[0]);
      return;
    }

    const points = map.queryRenderedFeatures(event.point, {
      layers: [PLACES_POINT_LAYER_ID],
    });
    if (points[0]) {
      showPlacePopup(points[0]);
    }
  };

  const setPointer = () => {
    canvas.style.cursor = "pointer";
  };
  const clearPointer = () => {
    canvas.style.cursor = "";
  };

  map.on("click", onMapClick);
  map.on("mouseenter", PLACES_CLUSTER_LAYER_ID, setPointer);
  map.on("mouseleave", PLACES_CLUSTER_LAYER_ID, clearPointer);
  map.on("mouseenter", PLACES_POINT_LAYER_ID, setPointer);
  map.on("mouseleave", PLACES_POINT_LAYER_ID, clearPointer);

  return () => {
    popup.remove();
    map.off("click", onMapClick);
    map.off("mouseenter", PLACES_CLUSTER_LAYER_ID, setPointer);
    map.off("mouseleave", PLACES_CLUSTER_LAYER_ID, clearPointer);
    map.off("mouseenter", PLACES_POINT_LAYER_ID, setPointer);
    map.off("mouseleave", PLACES_POINT_LAYER_ID, clearPointer);
    clearPointer();
  };
}
