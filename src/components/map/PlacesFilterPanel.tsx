"use client";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@shappoff/ui";
import { useEffect, useRef, useState } from "react";
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

type FilterFieldsProps = {
  index: AtdFilterIndex | null;
  value: AtdFilterSelection;
  onChange: (value: AtdFilterSelection) => void;
  onCleared?: () => void;
};

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

function PlacesFilterFields({
  index,
  value,
  onChange,
  onCleared,
}: FilterFieldsProps) {
  const options = atdFilterOptions(index ?? { paths: [] }, value);
  const disabled = index == null;
  const filtersActive = hasAtdFilterSelection(value);

  function update(next: AtdFilterSelection) {
    if (!index) {
      onChange(next);
      return;
    }
    onChange(constrainAtdSelection(index, next));
  }

  function clearAll() {
    onChange(EMPTY_ATD_FILTER_SELECTION);
    onCleared?.();
  }

  return (
    <>
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
    </>
  );
}

function PlacesFilterBar({ index, value, onChange }: PlacesFilterPanelProps) {
  const panelRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const mapRoot = panel?.closest(".sui-map");
    if (!(panel instanceof HTMLElement) || !(mapRoot instanceof HTMLElement)) {
      return;
    }

    const syncOffset = () => {
      mapRoot.style.setProperty(
        FILTER_PANEL_OFFSET_VAR,
        `${panel.offsetHeight}px`,
      );
    };

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    observer.observe(panel);

    return () => {
      observer.disconnect();
      mapRoot.style.removeProperty(FILTER_PANEL_OFFSET_VAR);
    };
  }, []);

  return (
    <form
      ref={panelRef}
      className={styles.panel}
      aria-label="Фильтры административного деления"
      onSubmit={(event) => event.preventDefault()}
    >
      <PlacesFilterFields index={index} value={value} onChange={onChange} />
    </form>
  );
}

function PlacesFilterDrawer({
  index,
  value,
  onChange,
}: PlacesFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const filtersActive = hasAtdFilterSelection(value);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          filtersActive
            ? "Показать фильтры, фильтры применены"
            : "Показать фильтры"
        }
        onClick={() => setOpen(true)}
      >
        <FilterIcon />
        {filtersActive ? (
          <span className={styles.dot} aria-hidden="true" />
        ) : null}
      </button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        modal
        swipeDirection="down"
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader>
            <div className={styles.drawerHeading}>
              <DrawerTitle className={styles.drawerTitle}>Фильтры</DrawerTitle>
              <DrawerClose className={styles.drawerClose} aria-label="Закрыть">
                ×
              </DrawerClose>
            </div>
          </DrawerHeader>
          <DrawerBody>
            <form
              className={styles.drawerFields}
              aria-label="Фильтры административного деления"
              onSubmit={(event) => event.preventDefault()}
            >
              <PlacesFilterFields
                index={index}
                value={value}
                onChange={onChange}
                onCleared={() => setOpen(false)}
              />
            </form>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function PlacesFilterPanel(props: PlacesFilterPanelProps) {
  const narrow = useNarrowViewport();
  if (narrow) {
    return <PlacesFilterDrawer {...props} />;
  }
  return <PlacesFilterBar {...props} />;
}
