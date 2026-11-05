"use client";

import { useEffect, useState } from "react";
import {
  type AtdFilterIndex,
  type AtdFilterSelection,
  atdFilterOptions,
  constrainAtdSelection,
} from "@/prebuild/atdHierarchy";
import { FilterCombobox } from "./FilterCombobox";
import styles from "./PlacesFilterPanel.module.css";

type PlacesFilterPanelProps = {
  filtersUrl: string;
  value: AtdFilterSelection;
  onChange: (value: AtdFilterSelection) => void;
};

export function PlacesFilterPanel({
  filtersUrl,
  value,
  onChange,
}: PlacesFilterPanelProps) {
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
