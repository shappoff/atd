"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  type AtdFilterIndex,
  type AtdFilterSelection,
  atdFilterOptions,
  constrainAtdSelection,
  EMPTY_ATD_FILTER_SELECTION,
  hasAtdFilterSelection,
} from "@/prebuild/atdHierarchy";
import { FilterCombobox } from "./FilterCombobox";
import styles from "./PlacesFilterPanel.module.css";
import { useNarrowViewport } from "./useNarrowViewport";

type PlacesFilterPanelProps = {
  index: AtdFilterIndex | null;
  value: AtdFilterSelection;
  onChange: (value: AtdFilterSelection) => void;
};

const FILTER_PANEL_OFFSET_VAR = "--atd-filter-panel-offset";

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 3.5h12M4 8h8M6 12.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}

export function PlacesFilterPanel({
  index,
  value,
  onChange,
}: PlacesFilterPanelProps) {
  const panelRef = useRef<HTMLFormElement>(null);
  const panelId = useId();
  const narrow = useNarrowViewport();
  const [open, setOpen] = useState(false);
  const showPanel = !narrow || open;
  const filtersActive = hasAtdFilterSelection(value);

  useEffect(() => {
    if (!narrow) {
      setOpen(false);
    }
  }, [narrow]);

  useEffect(() => {
    const panel = panelRef.current;
    const mapRoot = panel?.closest(".sui-map");
    if (!(panel instanceof HTMLElement) || !(mapRoot instanceof HTMLElement)) {
      return;
    }

    const syncOffset = () => {
      const height = showPanel ? panel.offsetHeight : 0;
      mapRoot.style.setProperty(FILTER_PANEL_OFFSET_VAR, `${height}px`);
    };

    syncOffset();
    if (!showPanel) {
      return () => {
        mapRoot.style.removeProperty(FILTER_PANEL_OFFSET_VAR);
      };
    }

    const observer = new ResizeObserver(syncOffset);
    observer.observe(panel);

    return () => {
      observer.disconnect();
      mapRoot.style.removeProperty(FILTER_PANEL_OFFSET_VAR);
    };
  }, [showPanel]);

  const options = atdFilterOptions(index ?? { paths: [] }, value);
  const disabled = index == null;

  function update(next: AtdFilterSelection) {
    if (!index) {
      onChange(next);
      return;
    }
    onChange(constrainAtdSelection(index, next));
  }

  function clearAll() {
    onChange(EMPTY_ATD_FILTER_SELECTION);
    if (narrow) {
      setOpen(false);
    }
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          open
            ? "Скрыть фильтры"
            : filtersActive
              ? "Показать фильтры, фильтры применены"
              : "Показать фильтры"
        }
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <CloseIcon /> : <FilterIcon />}
        {!open && filtersActive ? (
          <span className={styles.dot} aria-hidden="true" />
        ) : null}
      </button>

      <form
        id={panelId}
        ref={panelRef}
        className={styles.panel}
        data-open={open ? "" : undefined}
        aria-label="Фильтры административного деления"
        aria-hidden={showPanel ? undefined : true}
        onSubmit={(event) => event.preventDefault()}
      >
        <FilterCombobox
          label="Губерния"
          items={options.gubernias}
          value={value.gubernia}
          disabled={disabled}
          onValueChange={(gubernia) =>
            update({
              ...value,
              gubernia,
            })
          }
        />
        <FilterCombobox
          label="Уезд"
          items={options.uezds}
          value={value.uezd}
          disabled={disabled}
          onValueChange={(uezd) =>
            update({
              ...value,
              uezd,
            })
          }
        />
        <FilterCombobox
          label="Волость"
          items={options.volosts}
          value={value.volost}
          disabled={disabled}
          onValueChange={(volost) =>
            update({
              ...value,
              volost,
            })
          }
        />
        {filtersActive ? (
          <button
            type="button"
            className={styles.clearAll}
            disabled={disabled}
            onClick={clearAll}
          >
            Очистить все фильтры
          </button>
        ) : null}
      </form>
    </div>
  );
}
