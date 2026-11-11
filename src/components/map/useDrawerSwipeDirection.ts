"use client";

import { useEffect, useState } from "react";

const DESKTOP_DRAWER_QUERY = "(min-width: 40rem)";

function drawerSwipeDirection(): "down" | "right" {
  if (typeof window === "undefined") {
    return "down";
  }
  return window.matchMedia(DESKTOP_DRAWER_QUERY).matches ? "right" : "down";
}

export function useDrawerSwipeDirection(): "down" | "right" {
  const [direction, setDirection] = useState(drawerSwipeDirection);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_DRAWER_QUERY);
    const sync = () => {
      setDirection(media.matches ? "right" : "down");
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return direction;
}
