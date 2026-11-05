"use client";

import { useEffect, useState } from "react";

/** Matches filter / basemap layout breakpoints in map CSS modules. */
export const NARROW_VIEWPORT_QUERY = "(max-width: 40rem)";

export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const sync = () => {
      setNarrow(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return narrow;
}
