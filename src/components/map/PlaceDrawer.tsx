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

function CopyIcon() {
  return (
    <svg className={styles.copyIcon} viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="5.25"
        y="5.25"
        width="8"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10.75 5.25V3.25a1 1 0 0 0-1-1h-6.5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 1 1h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className={styles.copyIcon} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoordinatesField({ value }: { value: string }) {
  const [copyState, setCopyState] = useState<{
    value: string;
    tick: number;
  } | null>(null);
  if (copyState && copyState.value !== value) {
    setCopyState(null);
  }
  const copied = copyState?.value === value;

  useEffect(() => {
    if (copyState == null) {
      return;
    }
    const timer = window.setTimeout(() => setCopyState(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  if (!value.trim()) {
    return null;
  }

  function markCopied() {
    setCopyState((current) => ({
      value,
      tick: (current?.tick ?? 0) + 1,
    }));
  }

  function copyWithSelection(): boolean {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.append(area);
    const previous = document.activeElement;
    area.focus();
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    if (previous instanceof HTMLElement) {
      previous.focus();
    }
    return ok;
  }

  async function copyCoordinates() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        markCopied();
        return;
      }
    } catch {
      // The clipboard API can reject even after a click. Fall back below.
    }
    if (copyWithSelection()) {
      markCopied();
    }
  }

  return (
    <Field label="Координаты">
      <div className={styles.coordinates}>
        <p className={styles.value}>{value}</p>
        <button
          type="button"
          className={copied ? `${styles.copy} ${styles.copyDone}` : styles.copy}
          onClick={() => {
            void copyCoordinates();
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span className={copied ? undefined : styles.visuallyHidden}>
            {copied ? "Скопировано" : "Скопировать в буфер обмена"}
          </span>
        </button>
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
      <CoordinatesField value={coordinates(place)} />
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
