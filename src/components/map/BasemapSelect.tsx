"use client";

import { Select } from "@base-ui/react/select";
import {
  TILE_LAYER_ORDER,
  TILE_LAYERS,
  type TileLayerId,
} from "@shappoff/ui/map";
import styles from "./BasemapSelect.module.css";

const BASEMAP_ITEMS = TILE_LAYER_ORDER.map((id) => ({
  value: id,
  label: TILE_LAYERS[id].label,
}));

type BasemapSelectProps = {
  value: TileLayerId;
  onChange: (id: TileLayerId) => void;
};

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m2.5 8.5 4 4 7-9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BasemapSelect({ value, onChange }: BasemapSelectProps) {
  return (
    <div className={styles.root}>
      <Select.Root
        items={BASEMAP_ITEMS}
        value={value}
        modal={false}
        onValueChange={(next) => {
          if (next != null) {
            onChange(next);
          }
        }}
      >
        <Select.Trigger
          className="sui-map__switcher-trigger"
          aria-label="Слой карты"
        >
          <Select.Value className="sui-map__switcher-value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.positioner}
            side="bottom"
            sideOffset={4}
            align="end"
            collisionPadding={8}
          >
            <Select.Popup className={styles.popup}>
              <Select.List className={styles.list}>
                {BASEMAP_ITEMS.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className={styles.item}
                  >
                    <Select.ItemIndicator
                      className={styles.indicator}
                      keepMounted
                    >
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.itemText}>
                      {item.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
