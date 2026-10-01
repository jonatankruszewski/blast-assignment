import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  /** Rendered as "Label (n)". */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export interface TabPanelProps {
  /** Same id as the matching tab item; renders id `panel-${id}`. */
  id: string;
  children?: ReactNode;
}
