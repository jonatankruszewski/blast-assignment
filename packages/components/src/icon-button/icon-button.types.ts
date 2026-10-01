import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> {
  /** Accessible name; also shown as a tooltip. */
  label: string;
  icon: ReactNode;
  size?: "sm" | "md";
  /** Show the label as a tooltip on hover/focus (default true). */
  showTooltip?: boolean;
  /** For use on the dark top nav. */
  onDark?: boolean;
}
