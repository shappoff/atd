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
import { type ReactNode, useEffect, useState } from "react";
import type { PlaceDetails } from "@/prebuild/placeDetails";
import styles from "./PlaceDrawer.module.css";

const DESKTOP_DRAWER_QUERY = "(min-width: 40rem)";

function useDrawerSwipeDirection(): "down" | "right" {
  const [direction, setDirection] = useState<"down" | "right">("down");

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

function httpHref(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

function withoutYearPrefix(year: string, value: string): string {
  const prefix = `${year}:`;
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() : value;
}

const OWNER_YEAR = /^(\d*?)((?:1[7-9]|20)\d{2}):([\s\S]*)$/;

function ownerRecord(value: string): { year: string; name: string } | null {
  const trimmed = value.trim();
  const match = trimmed.match(OWNER_YEAR);
  if (!match) {
    const name = trimmed.replace(/^:/, "").replace(/\s+/g, " ").trim();
    return name ? { year: "", name } : null;
  }

  const year = match[2] ?? "";
  const name = (match[3] ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(new RegExp(`\\(${year}\\s+год\\)$`), "")
    .trim();

  if (!year && !name) {
    return null;
  }

  return { year, name };
}

function coordinates(place: PlaceDetails): string {
  if (place.lat == null || place.lng == null) {
    return "";
  }
  return `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.field}>
      <h3 className={styles.label}>{label}</h3>
      {children}
    </section>
  );
}

function TextValue({ value }: { value: string }) {
  const parts = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return <p className={styles.value}>{value}</p>;
  }
  const seen = new Map<string, number>();
  return (
    <ul className={styles.list}>
      {parts.map((part) => {
        const count = seen.get(part) ?? 0;
        seen.set(part, count + 1);
        const key = count === 0 ? part : `${part}:${count}`;
        return <li key={key}>{part}</li>;
      })}
    </ul>
  );
}

function OwnerField({ value }: { value: string }) {
  const record = ownerRecord(value);
  if (!record) {
    return null;
  }
  if (!record.year) {
    return (
      <Field label="Владелец">
        <p className={styles.value}>{record.name}</p>
      </Field>
    );
  }

  return (
    <Field label="Владелец">
      <div className={styles.owner}>
        <span className={styles.ownerYear}>{record.year}</span>
        {record.name ? <p className={styles.value}>{record.name}</p> : null}
      </div>
    </Field>
  );
}

function TextField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null;
  }
  return (
    <Field label={label}>
      <TextValue value={value} />
    </Field>
  );
}

function YearFields({
  label,
  records,
}: {
  label: string;
  records: Record<string, string>;
}) {
  const entries = Object.entries(records)
    .filter(([, value]) => value.trim())
    .sort(([left], [right]) => left.localeCompare(right, "ru"));
  if (entries.length === 0) {
    return null;
  }

  return (
    <Field label={label}>
      <div className={styles.years}>
        {entries.map(([year, value]) => (
          <div key={year} className={styles.year}>
            <span className={styles.yearLabel}>{year}</span>
            <TextValue value={withoutYearPrefix(year, value)} />
          </div>
        ))}
      </div>
    </Field>
  );
}

function isDebugLinkEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("debug") === "true";
}

function LinkField({ value }: { value: string }) {
  const href = httpHref(value);
  if (!isDebugLinkEnabled() || !href) {
    return null;
  }
  return (
    <Field label="Ссылка">
      <a
        className={`${styles.value} ${styles.link}`}
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {href}
      </a>
    </Field>
  );
}

function PlaceFacts({ place }: { place: PlaceDetails }) {
  return (
    <div className={styles.fields}>
      <OwnerField value={place.owner} />
      <TextField label="Костёл" value={place.kostel} />
      <YearFields label="Епархия" records={place.eparchy} />
      <YearFields label="Административное деление" records={place.atd} />
      <TextField label="Координаты" value={coordinates(place)} />
      <LinkField value={place.link} />
    </div>
  );
}

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
