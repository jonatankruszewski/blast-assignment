import type { ReactNode } from "react";

export interface MenuSelectOption {
  value: string;
  label: string;
}

export interface MenuSelectProps {
  /** Visible prefix, rendered as "Label: Selected". */
  label?: string;
  icon?: ReactNode;
  value?: string | undefined;
  options: MenuSelectOption[];
  onChange: (value: string) => void;
  /** Accessible name of the control (announced with the current value). */
  ariaLabel: string;
  /** Shown when no option matches `value`. Defaults to `ariaLabel`. */
  placeholder?: string;
  /** `ghost` = inline text control; `field` = bordered input look; `nav` = field on the dark top nav. */
  variant?: "ghost" | "field" | "nav";
  size?: "sm" | "md";
  /** Which edge the menu aligns to. */
  menuAlign?: "start" | "end";
  disabled?: boolean;
}
