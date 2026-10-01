import type { ReactNode } from "react";
import type { Tone } from "../tokens/tokens.types.js";

export interface IconTileProps {
  tone: Tone;
  icon: ReactNode;
  /** sm 22px (inline with text), md 32px, lg 40px (drawer header). */
  size?: "sm" | "md" | "lg";
  /** `soft` = tinted bg + tone icon; `solid` = filled tone + white icon (service icons). */
  variant?: "soft" | "solid";
  /** Accessible name; decorative when omitted. */
  label?: string;
}
