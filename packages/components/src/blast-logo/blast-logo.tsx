import { Waves } from "lucide-react";
import styles from "./blast-logo.module.css";
import type { BlastLogoProps } from "./blast-logo.types.js";

/** Placeholder mark built from a lucide icon until brand assets arrive. */
export function BlastLogo({ showWordmark = true }: BlastLogoProps) {
  return (
    <span className={styles.logo} role="img" aria-label="Blast">
      <span className={styles.mark} aria-hidden="true">
        <Waves strokeWidth={2.5} />
      </span>
      {showWordmark && (
        <span className={styles.wordmark} aria-hidden="true">
          BLAST
        </span>
      )}
    </span>
  );
}
