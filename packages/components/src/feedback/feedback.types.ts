import type { ReactNode } from "react";

export interface SpinnerProps {
  /** Accessible label announced to screen readers. */
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Hide from assistive tech (e.g. inside a busy button that already says so). */
  decorative?: boolean;
}

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: "sm" | "md" | "full";
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}
