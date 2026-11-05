"use client";

import { Combobox } from "@base-ui/react/combobox";
import { useId } from "react";
import styles from "./FilterCombobox.module.css";

type FilterComboboxProps = {
  label: string;
  placeholder: string;
  items: string[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
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

export function FilterCombobox({
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
