import { DataTable, EmptyState, ErrorState, Skeleton, Stack } from "@blast/components";
import type { RowTab } from "../../../domain/guardrail.types.js";
import { useTabRows } from "../../../hooks/use-tab-rows.js";
import { ROW_TAB_COLUMNS, ROW_TAB_TITLES } from "./row-tab-columns.js";

interface RowTabPanelProps<K extends RowTab> {
  guardrailId: string;
  tab: K;
}

export function RowTabPanel<K extends RowTab>({ guardrailId, tab }: RowTabPanelProps<K>) {
  const rows = useTabRows(guardrailId, tab);
  const titles = ROW_TAB_TITLES[tab];

  if (rows.isPending) {
    return (
      <Stack direction="column" gap={2}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </Stack>
    );
  }
  if (rows.isError) {
    return (
      <ErrorState
        title={`Could not load ${titles.table.toLowerCase()}`}
        onRetry={() => {
          void rows.refetch();
        }}
      />
    );
  }
  return (
    <DataTable
      ariaLabel={titles.table}
      columns={ROW_TAB_COLUMNS[tab]}
      rows={rows.data}
      getRowId={(row) => row.id}
      emptyState={<EmptyState title={titles.empty} />}
    />
  );
}
