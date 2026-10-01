import { clsx } from "clsx";
import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import styles from "./menu-select.module.css";
import type { MenuSelectProps } from "./menu-select.types.js";

/**
 * Select-only combobox (WAI-ARIA APG pattern): a button that opens a listbox.
 * Arrow keys / Home / End / type-ahead move, Enter or Space picks, Escape closes.
 */
export function MenuSelect({
  label,
  icon,
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  variant = "ghost",
  size = "md",
  menuAlign = "start",
  disabled = false,
}: MenuSelectProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-opt-${String(index)}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${String(activeIndex)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const openMenu = (index = Math.max(selectedIndex, 0)) => {
    if (disabled || options.length === 0) return;
    setActiveIndex(index);
    setOpen(true);
  };

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(
        event.key === "ArrowUp" && selectedIndex < 0
          ? options.length - 1
          : Math.max(selectedIndex, 0),
      );
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const key = event.key.toLowerCase();
          const ordered = [...options.slice(activeIndex + 1), ...options.slice(0, activeIndex + 1)];
          const match = ordered.find((option) => option.label.toLowerCase().startsWith(key));
          if (match) setActiveIndex(options.indexOf(match));
        }
    }
  };

  const indexFromEvent = (event: MouseEvent | PointerEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    return el ? Number(el.dataset.index) : -1;
  };

  const shownLabel = selected?.label;
  const text = label ? `${label}: ${shownLabel ?? placeholder ?? ""}`.trim() : shownLabel;

  return (
    <div ref={rootRef} className={clsx(styles.root, variant !== "ghost" && styles.fieldRoot)}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(styles.trigger, styles[variant], size === "sm" && styles.sm)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel}${shownLabel ? `: ${shownLabel}` : ""}`}
        disabled={disabled}
        onClick={() => {
          if (open) close();
          else openMenu();
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={clsx(styles.text, !text && styles.placeholder)}>
          {text ?? placeholder ?? ariaLabel}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={optionId(activeIndex)}
          className={clsx(styles.menu, menuAlign === "end" ? styles.alignEnd : styles.alignStart)}
          onKeyDown={onListKeyDown}
          onClick={(event) => {
            const index = indexFromEvent(event);
            if (index >= 0) choose(index);
          }}
          onPointerMove={(event) => {
            const index = indexFromEvent(event);
            if (index >= 0 && index !== activeIndex) setActiveIndex(index);
          }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              data-index={index}
              className={clsx(styles.option, index === activeIndex && styles.active)}
            >
              <span>{option.label}</span>
              {index === selectedIndex && (
                <span className={styles.check} aria-hidden="true">
                  <Check />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
