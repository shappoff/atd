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
import { useEffect, useId, useMemo, useState } from "react";
import type { AtdFilterSelection } from "@/prebuild/atdHierarchy";
import {
  filterUnlocatedPlaces,
  type UnlocatedPlace,
  unlocatedListActive,
  unlocatedScopeLabel,
} from "./filterUnlocatedPlaces";
import { readUnlocatedPlaces } from "./loadUnlocatedPlaces";
import { PlaceFacts } from "./PlaceFacts";
import styles from "./UnlocatedPlaces.module.css";
import { useDrawerSwipeDirection } from "./useDrawerSwipeDirection";

type UnlocatedPlacesProps = {
  url: string;
  selection: AtdFilterSelection;
};

function MissingCoordinatesIcon() {
  return (
    <svg
      className={styles.icon}
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2.25a5.25 5.25 0 0 0-5.25 5.25c0 3.7 5.25 9.25 5.25 9.25s5.25-5.55 5.25-9.25A5.25 5.25 0 0 0 10 2.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7.5" r="1.35" fill="currentColor" />
      <path
        d="M3.25 16.75 16.75 3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg
      className={styles.caret}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 6h8L8 10.5z" />
    </svg>
  );
}

function settlementCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} населённый пункт`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} населённых пункта`;
  }
  return `${count} населённых пунктов`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function UnlocatedPlaces({ url, selection }: UnlocatedPlacesProps) {
  const { gubernia, uezd, volost } = selection;
  const active = unlocatedListActive(selection);
  const swipeDirection = useDrawerSwipeDirection();
  const listId = useId();
  const [catalog, setCatalog] = useState<UnlocatedPlace[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openRow, setOpenRow] = useState<number | null>(null);
  const selectionKey = `${gubernia ?? ""}\0${uezd ?? ""}\0${volost ?? ""}`;
  const [trackedKey, setTrackedKey] = useState(selectionKey);

  if (trackedKey !== selectionKey) {
    setTrackedKey(selectionKey);
    setQuery("");
    setOpenRow(null);
  }

  useEffect(() => {
    if (!active || catalog) {
      return;
    }

    const controller = new AbortController();
    let alive = true;

    readUnlocatedPlaces(url, controller.signal)
      .then((places) => {
        if (alive) {
          setCatalog(places);
        }
      })
      .catch((error: unknown) => {
        if (!alive || isAbortError(error)) {
          return;
        }
        setCatalog([]);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [active, catalog, url]);

  const visible = useMemo(() => {
    if (!catalog) {
      return [];
    }
    return filterUnlocatedPlaces(catalog, { gubernia, uezd, volost });
  }, [catalog, gubernia, uezd, volost]);

  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const shown = useMemo(() => {
    if (!normalizedQuery) {
      return visible;
    }
    return visible.filter((place) =>
      `${place.title}\n${place.type}`
        .toLocaleLowerCase("ru")
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, visible]);

  if (open && (!active || (catalog != null && visible.length === 0))) {
    setOpen(false);
  }

  if (!active || visible.length === 0) {
    return null;
  }

  const scope = unlocatedScopeLabel({ gubernia, uezd, volost });
  const countLabel = `${settlementCount(visible.length)} без координат`;
  const drawerDescription = normalizedQuery
    ? `Найдено ${shown.length} из ${visible.length}`
    : countLabel;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setOpenRow(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          swipeDirection === "right"
            ? `${styles.edge} ${styles.edgeRight}`
            : `${styles.edge} ${styles.edgeBottom}`
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${countLabel}, ${scope}`}
        onClick={() => setOpen(true)}
      >
        <MissingCoordinatesIcon />
        <span className={styles.label}>
          <span className={styles.count}>{visible.length}</span>
          <span className={styles.caption}>без координат</span>
        </span>
      </button>

      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        modal
        swipeDirection={swipeDirection}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader>
            <div className={styles.header}>
              <div className={styles.heading}>
                <DrawerTitle>{scope}</DrawerTitle>
                <DrawerDescription>{drawerDescription}</DrawerDescription>
              </div>
              <DrawerClose className={styles.close} aria-label="Закрыть">
                ×
              </DrawerClose>
            </div>
            <input
              className={styles.search}
              value={query}
              placeholder="Поиск"
              aria-label="Поиск населённого пункта"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
          </DrawerHeader>
          <DrawerBody>
            {open && shown.length === 0 ? (
              <p className={styles.empty}>Ничего не найдено</p>
            ) : null}
            {open && shown.length > 0 ? (
              <ul className={styles.list}>
                {shown.map((place) => (
                  <UnlocatedPlaceItem
                    key={place.row}
                    place={place}
                    listId={listId}
                    expanded={openRow === place.row}
                    onToggle={() =>
                      setOpenRow((current) =>
                        current === place.row ? null : place.row,
                      )
                    }
                  />
                ))}
              </ul>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function UnlocatedPlaceItem({
  place,
  listId,
  expanded,
  onToggle,
}: {
  place: UnlocatedPlace;
  listId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `${listId}-${place.row}`;
  const type = place.type.trim();

  return (
    <li className={expanded ? styles.entryOpen : undefined}>
      <button
        type="button"
        className={expanded ? `${styles.item} ${styles.itemOpen}` : styles.item}
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        onClick={onToggle}
      >
        <span className={styles.itemTitle}>{place.title}</span>
        {type ? <span className={styles.itemType}>{type}</span> : <span />}
        <CaretIcon />
      </button>
      {expanded ? (
        <div id={panelId} className={styles.facts}>
          <PlaceFacts place={place} />
        </div>
      ) : null}
    </li>
  );
}
