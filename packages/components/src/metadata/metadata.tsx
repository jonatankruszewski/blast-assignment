import styles from "./metadata.module.css";
import type { MetadataItemProps, MetadataPanelProps } from "./metadata.types.js";

export function MetadataPanel({ header, ariaLabel = "Details", children }: MetadataPanelProps) {
  return (
    <div className={styles.panel}>
      {header && <div className={styles.header}>{header}</div>}
      <dl className={styles.card} aria-label={ariaLabel}>
        {children}
      </dl>
    </div>
  );
}

export function MetadataItem({ label, children }: MetadataItemProps) {
  return (
    <div className={styles.item}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}
