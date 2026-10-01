import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Cell renderer; defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
  /** CSS width, e.g. 120 or "30%". */
  width?: number | string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Makes rows activatable (mouse anywhere on the row, keyboard via the first cell). */
  onRowClick?: (row: T) => void;
  /** Label for the row action read by screen readers, e.g. row => `Open ${row.name}`. */
  getRowLabel?: (row: T) => string;
  ariaLabel: string;
  emptyState?: ReactNode;
}
