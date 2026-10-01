import { clsx } from "clsx";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "../button/button.js";
import { VisuallyHidden } from "../visually-hidden/visually-hidden.js";
import styles from "./feedback.module.css";
import type {
  EmptyStateProps,
  ErrorStateProps,
  SkeletonProps,
  SpinnerProps,
} from "./feedback.types.js";

export function Spinner({ label = "Loading", size = "md", decorative = false }: SpinnerProps) {
  if (decorative) {
    return <span className={clsx(styles.spinner, styles[size])} aria-hidden="true" />;
  }
  return (
    <span role="status">
      <span className={clsx(styles.spinner, styles[size])} aria-hidden="true" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

const toCss = (v: number | string | undefined, fallback: string) =>
  v === undefined ? fallback : typeof v === "number" ? `${String(v)}px` : v;

export function Skeleton({ width, height, radius = "sm" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.skeleton, styles[`radius-${radius}`])}
      style={{ width: toCss(width, "100%"), height: toCss(height, "16px") }}
    />
  );
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon} aria-hidden="true">
        {icon ?? <Inbox />}
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <span className={clsx(styles.stateIcon, styles.errorIcon)} aria-hidden="true">
        <AlertTriangle />
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
