"use client";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@shappoff/ui";
import type { PlaceDetails } from "@/prebuild/placeDetails";
import styles from "./PlaceDrawer.module.css";
import { PlaceFacts } from "./PlaceFacts";
import { useDrawerSwipeDirection } from "./useDrawerSwipeDirection";

export type PlaceDrawerState = {
  title: string;
  type: string;
  details: PlaceDetails | null;
  error: boolean;
};

type PlaceDrawerProps = {
  open: boolean;
  place: PlaceDrawerState | null;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
};

export function PlaceDrawer({
  open,
  place,
  onOpenChange,
  onOpenChangeComplete,
}: PlaceDrawerProps) {
  const title = place?.title.trim() || "Населённый пункт";
  const type = place?.type.trim() ?? "";
  const swipeDirection = useDrawerSwipeDirection();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      modal
      swipeDirection={swipeDirection}
      showSwipeHandle
    >
      <DrawerContent>
        <DrawerHeader>
          <div className={styles.header}>
            <div className={styles.heading}>
              {type ? <DrawerDescription>{type}</DrawerDescription> : null}
              <DrawerTitle>{title}</DrawerTitle>
            </div>
            <DrawerClose className={styles.close} aria-label="Закрыть">
              ×
            </DrawerClose>
          </div>
        </DrawerHeader>
        <DrawerBody
          aria-busy={place != null && place.details == null && !place.error}
        >
          {place?.error ? (
            <p className={styles.status}>Не удалось загрузить сведения.</p>
          ) : null}
          {place && !place.error && place.details == null ? (
            <p className={styles.status}>Загрузка…</p>
          ) : null}
          {place?.details ? <PlaceFacts place={place.details} /> : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
