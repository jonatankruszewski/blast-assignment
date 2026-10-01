import type { ReactNode } from "react";
import type { Tone } from "../tokens/tokens.types.js";

export interface GraphPillProps {
  tone: Tone;
  icon?: ReactNode;
  label: string;
  /** soft = tinted bg + border (actions); outline = white bg + border (Permissions, Deny); solid = filled (policy). */
  variant?: "soft" | "solid" | "outline";
  /** md ≈ 32px tall; sm ≈ 24px (policy satellites). Solid defaults to sm. */
  size?: "sm" | "md";
  /** Hover affordance; the graph library owns the actual button role. */
  interactive?: boolean;
  selected?: boolean;
}

export interface CountChipProps {
  tone: Tone;
  count: number | string;
  icon: ReactNode;
  /** Accessible description, e.g. "15 identities". */
  label?: string;
}

export interface GraphContainerProps {
  width?: number | string;
  height?: number | string;
  children?: ReactNode;
}

export interface GraphCalloutProps {
  tone: Tone;
  icon?: ReactNode;
  title: string;
  items: string[];
}

export interface GraphCaptionProps {
  tone: Tone;
  children: ReactNode;
}

export interface PortDotProps {
  tone: Tone;
}

export interface EdgeToneOptions {
  dashed?: boolean;
  /** Thicker stroke for highlighted paths. */
  emphasis?: boolean;
}
