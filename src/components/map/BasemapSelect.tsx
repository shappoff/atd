"use client";

import { Select } from "@base-ui/react/select";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@shappoff/ui";
import {
  TILE_LAYER_ORDER,
  TILE_LAYERS,
  type TileLayerId,
} from "@shappoff/ui/map";
import { useState } from "react";
import styles from "./BasemapSelect.module.css";
import sheet from "./drawerSheet.module.css";
import { useNarrowViewport } from "./useNarrowViewport";

const BASEMAP_NAME = "Слой карты";

const BASEMAP_ITEMS = TILE_LAYER_ORDER.map((id) => ({
  value: id,
  label: TILE_LAYERS[id].label,
}));

function basemapAriaLabel(label: string): string {
  return `${BASEMAP_NAME}: ${label}`;
}

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

function LayersIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5 2.25 3.9 8 6.3l5.75-2.4L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2.25 7.2 8 9.6l5.75-2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.25 10.35 8 12.75l5.75-2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BasemapTriggerContent({ label }: { label: string }) {
  return (
    <>
      <LayersIcon />
      <span className="sui-map__switcher-value">{label}</span>
    </>
  );
}

function BasemapMenu({ value, onChange }: BasemapSelectProps) {
  const layerLabel = TILE_LAYERS[value].label;

  return (
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
        aria-label={basemapAriaLabel(layerLabel)}
      >
        <BasemapTriggerContent label={layerLabel} />
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
  );
}

function BasemapDrawer({ value, onChange }: BasemapSelectProps) {
  const [open, setOpen] = useState(false);
  const layerLabel = TILE_LAYERS[value].label;

  return (
    <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
      <DrawerTrigger
        className="sui-map__switcher-trigger"
        aria-label={basemapAriaLabel(layerLabel)}
      >
        <BasemapTriggerContent label={layerLabel} />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className={sheet.heading}>
            <DrawerTitle className={sheet.title}>{BASEMAP_NAME}</DrawerTitle>
            <DrawerClose className={sheet.close} aria-label="Закрыть">
              ×
            </DrawerClose>
          </div>
        </DrawerHeader>
        <DrawerBody className={sheet.body}>
          <div className={styles.list}>
            {BASEMAP_ITEMS.map((item) => {
              const selected = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={styles.item}
                  data-selected={selected ? "" : undefined}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <span
                    className={styles.indicator}
                    data-selected={selected ? "" : undefined}
                  >
                    <CheckIcon />
                  </span>
                  <span className={styles.itemText}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export function BasemapSelect(props: BasemapSelectProps) {
  const narrow = useNarrowViewport();

  return (
    <div className={styles.root} data-narrow={narrow ? "" : undefined}>
      {narrow ? <BasemapDrawer {...props} /> : <BasemapMenu {...props} />}
    </div>
  );
}
