import { clsx } from "clsx";
import styles from "./avatar.module.css";
import type { AvatarProps } from "./avatar.types.js";

export function Avatar({ initials, label, size = "md" }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={label ?? initials}
      className={clsx(styles.avatar, size === "sm" && styles.sm)}
    >
      <span aria-hidden="true">{initials.slice(0, 2)}</span>
    </span>
  );
}
