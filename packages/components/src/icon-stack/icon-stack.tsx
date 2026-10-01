import { clsx } from "clsx";
import styles from "./icon-stack.module.css";
import type { IconStackProps } from "./icon-stack.types.js";

export function IconStack({ items, shape = "circle", variant = "solid", ariaLabel }: IconStackProps) {
  return (
    <ul className={styles.list} aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.id}>
          <span
            role="img"
            aria-label={item.label}
            title={item.label}
            data-tone={item.tone ?? "neutral"}
            className={clsx(
              styles.badge,
              shape === "square" && styles.square,
              variant === "soft" && styles.soft,
            )}
          >
            {item.icon}
          </span>
        </li>
      ))}
    </ul>
  );
}
