import type { ReactNode } from "react";
import type { SpaceStep } from "../tokens/tokens.types.js";

export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around";

export interface StackProps {
  direction?: "row" | "column";
  gap?: SpaceStep;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  /** Take the remaining space in the parent stack (flex: 1, min-size 0). */
  grow?: boolean;
  /** Inner padding on all sides. */
  padding?: SpaceStep;
  /** Stretch to the parent's full height. */
  fullHeight?: boolean;
  /** Rendered element. Use list elements for real lists. */
  as?: "div" | "section" | "ul" | "ol" | "li" | "nav" | "span";
  /** Collapse to a column below 720px (row stacks only). */
  responsive?: boolean;
  children?: ReactNode;
}
