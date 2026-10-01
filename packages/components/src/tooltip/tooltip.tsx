import { clsx } from "clsx";
import { cloneElement, useId, useState, type KeyboardEvent } from "react";
import styles from "./tooltip.module.css";
import type { TooltipProps } from "./tooltip.types.js";

/** Hover/focus tooltip. Escape dismisses it. */
export function Tooltip({ content, children, placement = "top" }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const show = () => {
    setOpen(true);
  };
  const hide = () => {
    setOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <span
      className={styles.wrapper}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={onKeyDown}
    >
      {cloneElement(children, { "aria-describedby": open ? id : undefined })}
      {open && (
        <span role="tooltip" id={id} className={clsx(styles.tooltip, styles[placement])}>
          {content}
        </span>
      )}
    </span>
  );
}
