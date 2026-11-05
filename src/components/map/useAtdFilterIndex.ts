"use client";

import { useEffect, useState } from "react";
import type { AtdFilterIndex } from "@/prebuild/atdHierarchy";

export function useAtdFilterIndex(filtersUrl: string): AtdFilterIndex | null {
  const [index, setIndex] = useState<AtdFilterIndex | null>(null);

  useEffect(() => {
    let active = true;

    void fetch(filtersUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load filters: ${response.status}`);
        }
        return response.json() as Promise<AtdFilterIndex>;
      })
      .then((data) => {
        if (!active) {
          return;
        }
        if (!data || !Array.isArray(data.paths)) {
          setIndex({ paths: [] });
          return;
        }
        setIndex(data);
      })
      .catch(() => {
        if (active) {
          setIndex({ paths: [] });
        }
      });

    return () => {
      active = false;
    };
  }, [filtersUrl]);

  return index;
}
