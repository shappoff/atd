"use client";

import { useEffect, useRef } from "react";
import {
  type AtdFilterIndex,
  type AtdFilterSelection,
  atdFilterOptions,
  constrainAtdSelection,
} from "@/prebuild/atdHierarchy";
import { FilterCombobox } from "./FilterCombobox";
import styles from "./PlacesFilterPanel.module.css";

type PlacesFilterPanelProps = {
  index: AtdFilterIndex | null;
  value: AtdFilterSelection;
  onChange: (value: AtdFilterSelection) => void;
};

const FILTER_PANEL_OFFSET_VAR = "--atd-filter-panel-offset";

export function PlacesFilterPanel({
  index,
  value,
  onChange,
}: PlacesFilterPanelProps) {
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
        `${panel.getBoundingClientRect().height}px`,
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

  const options = atdFilterOptions(index ?? { paths: [] }, value);
  const disabled = index == null;

  function update(next: AtdFilterSelection) {
    if (!index) {
      onChange(next);
      return;
    }
    onChange(constrainAtdSelection(index, next));
  }

  return (
    <form
      ref={panelRef}
      className={styles.panel}
      aria-label="Фильтры административного деления"
      onSubmit={(event) => event.preventDefault()}
    >
      <FilterCombobox
        label="Губерния"
        placeholder="Все губернии"
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
        placeholder="Все уезды"
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
        placeholder="Все волости"
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
    </form>
  );
}
