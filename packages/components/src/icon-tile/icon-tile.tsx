import { clsx } from "clsx";
import styles from "./icon-tile.module.css";
import type { IconTileProps } from "./icon-tile.types.js";

export function IconTile({ tone, icon, size = "md", variant = "soft", label }: IconTileProps) {
  return (
    <span
      data-tone={tone}
      className={clsx(styles.tile, styles[size], variant === "solid" && styles.solid)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {icon}
    </span>
  );
}
