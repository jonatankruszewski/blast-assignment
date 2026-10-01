import type { ReactNode } from "react";
import styles from "./visually-hidden.module.css";

export interface VisuallyHiddenProps {
  children: ReactNode;
}

/** Content for screen readers only. */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className={styles.hidden}>{children}</span>;
}
