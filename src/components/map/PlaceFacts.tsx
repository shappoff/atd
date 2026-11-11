"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { PlaceDetails } from "@/prebuild/placeDetails";
import styles from "./PlaceDrawer.module.css";

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

function kostelNames(value: string): string[] {
  const bar = value.indexOf("|");
  const source = bar >= 0 ? value.slice(bar + 1) : "";
  return source
    .split("/")
    .map((name) => name.trim())
    .filter(Boolean);
}

function KostelField({ value }: { value: string }) {
  const names = kostelNames(value);
  if (names.length === 0) {
    return null;
  }
  if (names.length === 1) {
    return (
      <Field label="Костёл">
        <p className={styles.value}>{names[0]}</p>
      </Field>
    );
  }

  return (
    <Field label="Костёл">
      <ul className={`${styles.list} ${styles.names}`}>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </Field>
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

type EparchyPart =
  | { kind: "text"; text: string }
  | { kind: "parish"; unit: string; names: string[] };

function eparchyParts(value: string): EparchyPart[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const bar = part.indexOf("|");
      if (bar < 0) {
        return { kind: "text", text: part };
      }
      const unit = part.slice(0, bar).trim();
      const names = part
        .slice(bar + 1)
        .split("/")
        .map((name) => name.trim())
        .filter(Boolean);
      return { kind: "parish", unit, names };
    });
}

function partKey(part: EparchyPart): string {
  if (part.kind === "text") {
    return part.text;
  }
  return `${part.unit}|${part.names.join("/")}`;
}

function EparchyValue({ value }: { value: string }) {
  const parts = eparchyParts(value);
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1 && parts[0]?.kind === "text") {
    return <p className={styles.value}>{parts[0].text}</p>;
  }

  const seen = new Map<string, number>();
  return (
    <ul className={`${styles.list} ${styles.eparchy}`}>
      {parts.map((part) => {
        const id = partKey(part);
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        const key = count === 0 ? id : `${id}:${count}`;
        if (part.kind === "text") {
          return <li key={key}>{part.text}</li>;
        }
        return (
          <li key={key} className={styles.parish}>
            {part.unit ? (
              <p className={styles.parishUnit}>{part.unit}</p>
            ) : null}
            {part.names.length > 0 ? (
              <ul className={`${styles.list} ${styles.names}`}>
                {part.names.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function YearFields({
  label,
  records,
  renderValue,
}: {
  label: string;
  records: Record<string, string>;
  renderValue?: (value: string) => ReactNode;
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
        {entries.map(([year, value]) => {
          const text = withoutYearPrefix(year, value);
          return (
            <div key={year} className={styles.year}>
              <span className={styles.yearLabel}>{year}</span>
              {renderValue ? renderValue(text) : <TextValue value={text} />}
            </div>
          );
        })}
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

export function PlaceFacts({ place }: { place: PlaceDetails }) {
  return (
    <div className={styles.fields}>
      <OwnerField value={place.owner} />
      <KostelField value={place.kostel} />
      <YearFields
        label="Епархия"
        records={place.eparchy}
        renderValue={(value) => <EparchyValue value={value} />}
      />
      <YearFields label="Административное деление" records={place.atd} />
      <CoordinatesField value={coordinates(place)} />
      <LinkField value={place.link} />
    </div>
  );
}
