import { clsx } from "clsx";
import { useId } from "react";
import styles from "./section.module.css";
import type { SectionProps } from "./section.types.js";

export function Section({
  title,
  actions,
  variant = "plain",
  headingLevel = 3,
  grow = false,
  children,
}: SectionProps) {
  const headingId = useId();
  const Heading = `h${String(headingLevel)}` as "h2" | "h3" | "h4";
  return (
    <section
      aria-labelledby={headingId}
      className={clsx(styles.section, variant === "card" && styles.card, grow && styles.grow)}
    >
      <div className={styles.header}>
        <Heading id={headingId} className={styles.title}>
          {title}
        </Heading>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
