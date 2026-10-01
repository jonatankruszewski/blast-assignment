import styles from "./tag.module.css";
import type { TagProps } from "./tag.types.js";

export function Tag({ tone = "neutral", children }: TagProps) {
  return (
    <span className={styles.tag} data-tone={tone}>
      {children}
    </span>
  );
}
