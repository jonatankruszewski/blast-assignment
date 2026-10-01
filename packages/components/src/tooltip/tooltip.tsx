import { clsx } from "clsx";
import { cloneElement, useId, useState } from "react";
import styles from "./tooltip.module.css";
import type { TooltipProps } from "./tooltip.types.js";

/** Hover/focus tooltip. Escape dismisses it. */
export function Tooltip({ content, children, placement = "top" }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const child = children.props;

  const trigger = cloneElement(children, {
    "aria-describedby": open ? id : child["aria-describedby"],
    onPointerEnter: (event) => {
      child.onPointerEnter?.(event);
      setOpen(true);
    },
    onPointerLeave: (event) => {
      child.onPointerLeave?.(event);
      setOpen(false);
    },
    onFocus: (event) => {
      child.onFocus?.(event);
      setOpen(true);
    },
    onBlur: (event) => {
      child.onBlur?.(event);
      setOpen(false);
    },
    onKeyDown: (event) => {
      child.onKeyDown?.(event);
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        setOpen(false);
      }
    },
  });

  return (
    <span className={styles.wrapper}>
      {trigger}
      {open && (
        <span role="tooltip" id={id} className={clsx(styles.tooltip, styles[placement])}>
          {content}
        </span>
      )}
    </span>
  );
}
