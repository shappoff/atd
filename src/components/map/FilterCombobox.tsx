"use client";

import { Combobox } from "@base-ui/react/combobox";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@shappoff/ui";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./FilterCombobox.module.css";

const NARROW_VIEWPORT_QUERY = "(max-width: 40rem)";

type FilterComboboxProps = {
  label: string;
  placeholder: string;
  items: string[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
};

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const sync = () => {
      setNarrow(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return narrow;
}

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

function CaretIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function FilterComboboxPopup({
  label,
  placeholder,
  items,
  value,
  onValueChange,
  disabled = false,
}: FilterComboboxProps) {
  const id = useId();

  return (
    <Combobox.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
      }}
      disabled={disabled}
      modal={false}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <Combobox.InputGroup className={styles.inputGroup}>
          <Combobox.Input
            id={id}
            className={styles.input}
            placeholder={placeholder}
            autoComplete="off"
          />
          <div className={styles.actions}>
            <Combobox.Clear
              className={styles.clear}
              aria-label={`Сбросить фильтр «${label}»`}
            >
              <ClearIcon />
            </Combobox.Clear>
            <Combobox.Trigger
              className={styles.trigger}
              aria-label={`Открыть список «${label}»`}
            >
              <CaretIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          className={styles.positioner}
          sideOffset={4}
          align="start"
        >
          <Combobox.Popup className={styles.popup}>
            <Combobox.Empty className={styles.empty}>
              Ничего не найдено
            </Combobox.Empty>
            <Combobox.List className={styles.list}>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={styles.item}>
                  <Combobox.ItemIndicator className={styles.indicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.itemText}>{item}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function FilterOptionDrawer({
  label,
  placeholder,
  items,
  value,
  onValueChange,
  disabled = false,
}: FilterComboboxProps) {
  const labelId = useId();
  const searchId = useId();
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const visibleItems = normalizedQuery
    ? items.filter((item) =>
        item.toLocaleLowerCase("ru").includes(normalizedQuery),
      )
    : items;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
    }
  }

  function choose(next: string | null) {
    onValueChange(next);
    handleOpenChange(false);
  }

  return (
    <div className={styles.field}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <div className={styles.inputGroup}>
        <button
          type="button"
          className={styles.open}
          aria-labelledby={labelId}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <span className={value ? styles.valueText : styles.placeholder}>
            {value ?? placeholder}
          </span>
        </button>
        <div className={styles.actions}>
          {value ? (
            <button
              type="button"
              className={styles.clear}
              data-visible=""
              aria-label={`Сбросить фильтр «${label}»`}
              disabled={disabled}
              onClick={() => onValueChange(null)}
            >
              <ClearIcon />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.trigger}
            aria-label={`Открыть список «${label}»`}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <CaretIcon />
          </button>
        </div>
      </div>

      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        modal
        swipeDirection="down"
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader>
            <div className={styles.drawerHeading}>
              <DrawerTitle className={styles.drawerTitle}>{label}</DrawerTitle>
              <DrawerClose className={styles.drawerClose} aria-label="Закрыть">
                ×
              </DrawerClose>
            </div>
            <input
              id={searchId}
              className={styles.search}
              value={query}
              placeholder="Поиск"
              aria-label={`Поиск: ${label}`}
              autoComplete="off"
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
            />
          </DrawerHeader>
          <DrawerBody>
            {visibleItems.length === 0 ? (
              <p className={styles.empty}>Ничего не найдено</p>
            ) : (
              <div className={styles.list} role="listbox" aria-label={label}>
                {visibleItems.map((item) => {
                  const selected = item === value;
                  return (
                    <button
                      key={item}
                      ref={selected ? selectedRef : undefined}
                      type="button"
                      role="option"
                      className={styles.item}
                      aria-selected={selected}
                      data-selected={selected ? "" : undefined}
                      onClick={() => choose(item)}
                    >
                      <span
                        className={styles.indicator}
                        data-selected={selected ? "" : undefined}
                      >
                        <CheckIcon />
                      </span>
                      <span className={styles.itemText}>{item}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function FilterCombobox(props: FilterComboboxProps) {
  const narrow = useNarrowViewport();
  if (narrow) {
    return <FilterOptionDrawer {...props} />;
  }
  return <FilterComboboxPopup {...props} />;
}
