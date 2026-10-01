import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  /** Leading icon (lucide element). */
  icon?: ReactNode;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
}
