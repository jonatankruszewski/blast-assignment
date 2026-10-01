import { useRef, type KeyboardEvent } from "react";
import styles from "./tabs.module.css";
import type { TabPanelProps, TabsProps } from "./tabs.types.js";

export const tabId = (id: string) => `tab-${id}`;
export const panelId = (id: string) => `panel-${id}`;

/** WAI-ARIA tabs with automatic activation (arrow keys, Home, End). */
export function Tabs({ items, value, onChange, ariaLabel }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (id: string) => {
    listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(id))}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;
    const current = enabled.findIndex((item) => item.id === value);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % enabled.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + enabled.length) % enabled.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = enabled.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = enabled[next];
    if (!target) return;
    onChange(target.id);
    focusTab(target.id);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={styles.list}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={tabId(item.id)}
            aria-selected={selected}
            aria-controls={panelId(item.id)}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={styles.tab}
            onKeyDown={onKeyDown}
            onClick={() => {
              onChange(item.id);
            }}
          >
            {item.count === undefined ? item.label : `${item.label} (${String(item.count)})`}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={panelId(id)}
      aria-labelledby={tabId(id)}
      tabIndex={0}
      className={styles.panel}
    >
      {children}
    </div>
  );
}
