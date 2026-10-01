import { clsx } from "clsx";
import type { ReactNode } from "react";
import { EmptyState } from "../feedback/feedback.js";
import { VisuallyHidden } from "../visually-hidden/visually-hidden.js";
import styles from "./data-table.module.css";
import type { DataTableColumn, DataTableProps } from "./data-table.types.js";

const cellValue = <T,>(row: T, column: DataTableColumn<T>): ReactNode => {
  if (column.render) return column.render(row);
  const value: unknown = (row as Record<string, unknown>)[column.key];
  if (value === null || value === undefined) return "";
  return typeof value === "string" || typeof value === "number" ? value : JSON.stringify(value);
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  getRowLabel,
  ariaLabel,
  emptyState,
}: DataTableProps<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={styles.th}
                style={column.width === undefined ? undefined : { width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyState ?? <EmptyState title="Nothing to show yet" />}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowId(row)} className={clsx(styles.row, onRowClick && styles.clickable)}>
                {columns.map((column, index) => (
                  <td key={column.key} className={styles.td}>
                    {onRowClick && index === 0 ? (
                      <button
                        type="button"
                        className={styles.rowButton}
                        onClick={() => {
                          onRowClick(row);
                        }}
                      >
                        {cellValue(row, column)}
                        {getRowLabel && <VisuallyHidden>, {getRowLabel(row)}</VisuallyHidden>}
                      </button>
                    ) : (
                      cellValue(row, column)
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
