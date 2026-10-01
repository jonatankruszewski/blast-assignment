import type { FocusEvent, KeyboardEvent, PointerEvent, ReactElement, ReactNode } from "react";

export interface TooltipTriggerProps {
  "aria-describedby"?: string | undefined;
  onPointerEnter?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onPointerLeave?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
  onFocus?: ((event: FocusEvent<HTMLElement>) => void) | undefined;
  onBlur?: ((event: FocusEvent<HTMLElement>) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link). It receives aria-describedby. */
  children: ReactElement<TooltipTriggerProps>;
  placement?: "top" | "bottom";
}
