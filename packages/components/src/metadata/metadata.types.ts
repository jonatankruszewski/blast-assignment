import type { ReactNode } from "react";

export interface MetadataPanelProps {
  /** Row above the card (e.g. Hide Metadata button). */
  header?: ReactNode;
  /** Accessible name of the list. */
  ariaLabel?: string;
  children?: ReactNode;
}

export interface MetadataItemProps {
  label: string;
  children?: ReactNode;
}
