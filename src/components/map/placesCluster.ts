import {
  GeoJSONSource,
  LngLatBounds,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type Map as MapLibreGlMap,
  Popup as MapLibrePopup,
  type Popup,
} from "maplibre-gl";
import type { PlacesGeoJson } from "@/prebuild/placesGeoJson";

export const PLACES_SOURCE_ID = "atd-places";
export const PLACES_CLUSTER_LAYER_ID = "atd-places-clusters";
export const PLACES_CLUSTER_COUNT_LAYER_ID = "atd-places-cluster-count";
export const PLACES_POINT_LAYER_ID = "atd-places-points";
export const PLACES_ANCHOR_LAYER_ID = "atd-places-anchors";
export const PLACES_LABEL_LAYER_ID = "atd-places-labels";

export type PlaceHit = {
  id: number;
  title: string;
  type: string;
};

const CLUSTER_MAX_ZOOM = 20;
const CLUSTER_RADIUS = 1;
const FRAME_PADDING = 48;
const FRAME_MAX_ZOOM = 13;
const FRAME_DURATION = 800;
const PLACE_LABEL_MIN_ZOOM = 10;
const PLACE_DOT_RADIUS = 5;
const PLACE_ANCHOR_RADIUS = 3.5;
const GLYPHS_URL = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";
const FALLBACK_PRIMARY = "#0f766e";
const FALLBACK_PAPER = "#ffffff";
const PLACE_LABEL_FILL = "#ffffff";
const PLACE_LABEL_INK = "#000000";
const PLACE_LABEL_IMAGE_ID = "atd-places-label-bg";
const PLACE_LOCALITY_IMAGE_ID = "atd-places-locality";
const PLACE_LABEL_BORDER = 2;
const PLACE_LABEL_RADIUS = 8;
const PLACE_LABEL_IMAGE_SIZE = PLACE_LABEL_RADIUS * 2 + 4;
const PLACE_LABEL_PIXEL_RATIO = 2;
const PLACE_LOCALITY_SIZE = 16;
const PLACE_SPRITE_IDS = [PLACE_LABEL_IMAGE_ID, PLACE_LOCALITY_IMAGE_ID];
const PLACE_LAYER_IDS = [
  PLACES_LABEL_LAYER_ID,
  PLACES_ANCHOR_LAYER_ID,
  PLACES_CLUSTER_COUNT_LAYER_ID,
  PLACES_CLUSTER_LAYER_ID,
  PLACES_POINT_LAYER_ID,
];
const PLACE_HIT_LAYER_IDS = [
  PLACES_LABEL_LAYER_ID,
  PLACES_ANCHOR_LAYER_ID,
  PLACES_POINT_LAYER_ID,
];

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
  return `<p class="sui-map-marker__popup-description">${escapeHtml(type)}</p>${titleHtml}`;
}

type PlacesSourceData = string | PlacesGeoJson;

function placesSource(data: PlacesSourceData) {
  return {
    type: "geojson" as const,
    data,
    cluster: false,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_RADIUS,
  };
}

export function mountPlacesCluster(
  map: MapLibreGlMap,
  data: PlacesSourceData,
): void {
  map.setGlyphs(GLYPHS_URL);

  if (!map.getSource(PLACES_SOURCE_ID)) {
    map.addSource(PLACES_SOURCE_ID, placesSource(data));
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
    });
  }

  const paper = themeColor("--sui-color-bg", FALLBACK_PAPER);
  mountPlaceLabelImages(map, primary);

  addUnclusteredCircles(map, PLACES_POINT_LAYER_ID, primary, paper, {
    radius: PLACE_DOT_RADIUS,
    maxzoom: PLACE_LABEL_MIN_ZOOM,
  });
  addUnclusteredCircles(map, PLACES_ANCHOR_LAYER_ID, primary, paper, {
    radius: PLACE_ANCHOR_RADIUS,
    minzoom: PLACE_LABEL_MIN_ZOOM,
  });

  if (!map.getLayer(PLACES_LABEL_LAYER_ID)) {
    map.addLayer({
      id: PLACES_LABEL_LAYER_ID,
      type: "symbol",
      source: PLACES_SOURCE_ID,
      minzoom: PLACE_LABEL_MIN_ZOOM,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": PLACE_LABEL_IMAGE_ID,
        "icon-text-fit": "both",
        "icon-text-fit-padding": [2, 5, 2, 5],
        "text-field": [
          "format",
          ["image", PLACE_LOCALITY_IMAGE_ID],
          { "vertical-align": "center" },
          "\u2002",
          ["get", "title"],
        ],
        "text-font": ["Open Sans Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          PLACE_LABEL_MIN_ZOOM,
          14,
          PLACE_LABEL_MIN_ZOOM + 4,
          16,
        ],
        "text-variable-anchor": [
          "left",
          "right",
          "top",
          "bottom",
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
        "text-radial-offset": 1.2,
        "text-justify": "auto",
        "text-padding": 2,
        "text-max-width": 12,
      },
      paint: {
        "text-color": PLACE_LABEL_INK,
      },
    });
  }
}

function mountPlaceLabelImages(map: MapLibreGlMap, accent: string): void {
  const cap = PLACE_LABEL_RADIUS;
  const size = PLACE_LABEL_IMAGE_SIZE;
  addPlaceImage(map, PLACE_LABEL_IMAGE_ID, placeLabelBackground(accent), {
    pixelRatio: PLACE_LABEL_PIXEL_RATIO,
    stretchX: [[cap, size - cap]],
    stretchY: [[cap, size - cap]],
    content: [cap, cap, size - cap, size - cap],
  });
  addPlaceImage(map, PLACE_LOCALITY_IMAGE_ID, localityMark(accent), {
    pixelRatio: PLACE_LABEL_PIXEL_RATIO,
  });
}

function addPlaceImage(
  map: MapLibreGlMap,
  id: string,
  image: ImageData | null,
  options: {
    pixelRatio: number;
    stretchX?: Array<[number, number]>;
    stretchY?: Array<[number, number]>;
    content?: [number, number, number, number];
  },
): void {
  if (!image || map.hasImage(id)) {
    return;
  }
  map.addImage(id, image, options);
}

function placeRaster(
  size: number,
  draw: (context: CanvasRenderingContext2D) => void,
): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  draw(context);
  return context.getImageData(0, 0, size, size);
}

function fillRoundRect(
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function placeLabelBackground(accent: string): ImageData | null {
  const size = PLACE_LABEL_IMAGE_SIZE;
  const border = PLACE_LABEL_BORDER;
  const radius = PLACE_LABEL_RADIUS;
  return placeRaster(size, (context) => {
    fillRoundRect(context, accent, 0, 0, size, size, radius);
    fillRoundRect(
      context,
      PLACE_LABEL_FILL,
      border,
      border,
      size - border * 2,
      size - border * 2,
      radius - border,
    );
  });
}

function localityMark(accent: string): ImageData | null {
  const size = PLACE_LOCALITY_SIZE;
  return placeRaster(size, (context) => {
    context.fillStyle = accent;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    context.fill();
  });
}

function addUnclusteredCircles(
  map: MapLibreGlMap,
  id: string,
  fill: string,
  stroke: string,
  options: { radius: number; minzoom?: number; maxzoom?: number },
): void {
  if (map.getLayer(id)) {
    return;
  }
  map.addLayer({
    id,
    type: "circle",
    source: PLACES_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    ...(options.minzoom === undefined ? {} : { minzoom: options.minzoom }),
    ...(options.maxzoom === undefined ? {} : { maxzoom: options.maxzoom }),
    paint: {
      "circle-color": fill,
      "circle-radius": options.radius,
      "circle-stroke-width": 1,
      "circle-stroke-color": stroke,
    },
  });
}

export function unmountPlacesCluster(map: MapLibreGlMap): void {
  for (const layerId of PLACE_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  if (map.getSource(PLACES_SOURCE_ID)) {
    map.removeSource(PLACES_SOURCE_ID);
  }

  for (const imageId of PLACE_SPRITE_IDS) {
    if (map.hasImage(imageId)) {
      map.removeImage(imageId);
    }
  }
}

function placesGeoJsonSource(map: MapLibreGlMap): GeoJSONSource | null {
  const source = map.getSource(PLACES_SOURCE_ID);
  if (!(source instanceof GeoJSONSource)) {
    return null;
  }
  return source;
}

export function setPlacesClusterData(
  map: MapLibreGlMap,
  data: PlacesSourceData,
): void {
  const source = placesGeoJsonSource(map);
  if (!source) {
    return;
  }
  source.setData(data);
}

export function framePlaces(map: MapLibreGlMap, data: PlacesGeoJson): void {
  const bounds = placesBounds(data);
  if (!bounds) {
    return;
  }
  map.fitBounds(bounds, {
    padding: FRAME_PADDING,
    maxZoom: FRAME_MAX_ZOOM,
    duration: FRAME_DURATION,
    linear: true,
  });
}

function placesBounds(data: PlacesGeoJson): LngLatBounds | null {
  let bounds: LngLatBounds | null = null;
  for (const feature of data.features) {
    const [lng, lat] = feature.geometry.coordinates;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      continue;
    }
    if (!bounds) {
      bounds = new LngLatBounds([lng, lat], [lng, lat]);
      continue;
    }
    bounds.extend([lng, lat]);
  }
  return bounds;
}

function placeHit(feature: MapGeoJSONFeature): PlaceHit | null {
  const id = typeof feature.id === "number" ? feature.id : Number(feature.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    title: String(feature.properties?.title ?? ""),
    type: String(feature.properties?.type ?? "").trim(),
  };
}

export function attachPlacesClusterInteractions(
  map: MapLibreGlMap,
  onPlaceClick: (place: PlaceHit) => void,
): () => void {
  const popup: Popup = new MapLibrePopup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    maxWidth: "280px",
  });
  const canvas = map.getCanvas();
  let hoveredFeatureId: number | string | undefined;

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
    const featureId = feature.id;
    if (featureId != null && featureId === hoveredFeatureId && popup.isOpen()) {
      return;
    }
    const center = featureLngLat(feature);
    if (!center) {
      return;
    }
    hoveredFeatureId = featureId;
    popup.setLngLat(center).setHTML(popupHtml(feature)).addTo(map);
  };

  const hidePlacePopup = () => {
    hoveredFeatureId = undefined;
    popup.remove();
  };

  const onClusterClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      expandCluster(feature);
    }
  };

  const onPointClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }
    const hit = placeHit(feature);
    if (!hit) {
      return;
    }
    hidePlacePopup();
    onPlaceClick(hit);
  };

  const setPointer = () => {
    canvas.style.cursor = "pointer";
  };
  const clearPointer = () => {
    canvas.style.cursor = "";
  };

  const onPointHover = (event: MapLayerMouseEvent) => {
    setPointer();
    const feature = event.features?.[0];
    if (feature) {
      showPlacePopup(feature);
    }
  };

  const onPointLeave = () => {
    clearPointer();
    hidePlacePopup();
  };

  map.on("click", PLACES_CLUSTER_LAYER_ID, onClusterClick);
  map.on("mouseenter", PLACES_CLUSTER_LAYER_ID, setPointer);
  map.on("mouseleave", PLACES_CLUSTER_LAYER_ID, clearPointer);
  for (const layerId of PLACE_HIT_LAYER_IDS) {
    map.on("click", layerId, onPointClick);
    map.on("mouseenter", layerId, onPointHover);
    map.on("mousemove", layerId, onPointHover);
    map.on("mouseleave", layerId, onPointLeave);
  }

  return () => {
    popup.remove();
    map.off("click", PLACES_CLUSTER_LAYER_ID, onClusterClick);
    map.off("mouseenter", PLACES_CLUSTER_LAYER_ID, setPointer);
    map.off("mouseleave", PLACES_CLUSTER_LAYER_ID, clearPointer);
    for (const layerId of PLACE_HIT_LAYER_IDS) {
      map.off("click", layerId, onPointClick);
      map.off("mouseenter", layerId, onPointHover);
      map.off("mousemove", layerId, onPointHover);
      map.off("mouseleave", layerId, onPointLeave);
    }
    clearPointer();
  };
}
