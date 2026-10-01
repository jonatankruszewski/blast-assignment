import type { ReactNode } from "react";
import type { Tone } from "../tokens/tokens.types.js";

export interface IconStackItem {
  id: string;
  /** Accessible name and hover title. */
  label: string;
  icon: ReactNode;
  tone?: Tone;
}

export interface IconStackProps {
  items: IconStackItem[];
  /** `circle` badges (security requirements) or `square` tiles (risks). */
  shape?: "circle" | "square";
  /** `solid` filled badges (default) or `soft` tinted. */
  variant?: "solid" | "soft";
  /** Accessible name of the list. */
  ariaLabel?: string;
}
