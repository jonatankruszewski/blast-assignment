import type { ReactNode } from "react";

export interface SectionProps {
  title: string;
  /** Controls on the right of the title row (e.g. MenuSelects). */
  actions?: ReactNode;
  /** `card` = white bordered rounded box (Activities); `plain` = no frame. */
  variant?: "plain" | "card";
  headingLevel?: 2 | 3 | 4;
  /** Let the body grow to fill a column parent (for graphs). */
  grow?: boolean;
  children?: ReactNode;
}
