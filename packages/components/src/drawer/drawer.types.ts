import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children?: ReactNode;
}

export interface DrawerHeaderProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  /** Tooltip text for the (i) button next to the title. */
  info?: string;
  /** Top-right controls (Hide Metadata, copy link, close). */
  actions?: ReactNode;
  /** Usually a <Tabs>. */
  tabs?: ReactNode;
}

export interface DrawerBodyProps {
  main: ReactNode;
  /** Right column (~240px). Omitted when undefined. */
  aside?: ReactNode;
}

export interface DrawerFooterProps {
  children?: ReactNode;
}
