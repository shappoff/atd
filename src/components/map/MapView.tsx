"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

function MapLoading() {
  return (
    <div
      className="sui-map__skeleton"
      role="status"
      aria-busy="true"
      aria-label="Загрузка карты"
    />
  );
}

const MapCanvas = dynamic(
  () => import("./MapCanvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

type MapViewProps = {
  workerUrl: string;
  placesUrl: string;
  children?: ReactNode;
};

export function MapView({ workerUrl, placesUrl, children }: MapViewProps) {
  return (
    <MapCanvas workerUrl={workerUrl} placesUrl={placesUrl}>
      {children}
    </MapCanvas>
  );
}
