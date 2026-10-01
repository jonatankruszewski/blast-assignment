import type { ReactElement, ReactNode } from "react";

export interface TooltipTriggerProps {
  "aria-describedby"?: string | undefined;
}

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link). It receives aria-describedby. */
  children: ReactElement<TooltipTriggerProps>;
  placement?: "top" | "bottom";
}
