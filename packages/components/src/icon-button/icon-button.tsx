import { clsx } from "clsx";
import { Tooltip } from "../tooltip/tooltip.js";
import styles from "./icon-button.module.css";
import type { IconButtonProps } from "./icon-button.types.js";

export function IconButton({
  label,
  icon,
  size = "md",
  showTooltip = true,
  onDark = false,
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={clsx(styles.button, size === "sm" && styles.sm, onDark && styles.onDark, className)}
    >
      <span aria-hidden="true" className={styles.glyph}>
        {icon}
      </span>
    </button>
  );
  return showTooltip ? (
    <Tooltip content={label} placement="bottom">
      {button}
    </Tooltip>
  ) : (
    button
  );
}
