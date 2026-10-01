import { clsx } from "clsx";
import { Spinner } from "../feedback/feedback.js";
import styles from "./button.module.css";
import type { ButtonProps } from "./button.types.js";

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={clsx(styles.button, styles[variant], size === "sm" && styles.sm, className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Spinner size="sm" decorative />
      ) : (
        icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )
      )}
      {children}
    </button>
  );
}
