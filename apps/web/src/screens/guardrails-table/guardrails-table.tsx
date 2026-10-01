import {
  DataTable,
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  Stack,
  Tag,
  type DataTableColumn,
} from "@blast/components";
import type { Guardrail } from "../../domain/guardrail.types.js";
import { useDrawerRoute } from "../../hooks/use-drawer-route.js";
import { useGuardrails } from "../../hooks/use-guardrails.js";
import { SEVERITY_TONE } from "../guardrail-drawer/severity.js";

const COLUMNS: DataTableColumn<Guardrail>[] = [
  { key: "name", header: "Guardrail" },
  { key: "type", header: "Type" },
  { key: "cloudService", header: "Cloud service", render: (g) => g.cloudService.name },
  {
    key: "severity",
    header: "Severity",
    width: 110,
    render: (g) => <Tag tone={SEVERITY_TONE[g.severity]}>{g.severity.toUpperCase()}</Tag>,
  },
  {
    key: "violations",
    header: "Violations",
    width: 110,
    render: (g) => String(g.counts.violations),
  },
  {
    key: "status",
    header: "Status",
    width: 120,
    render: (g) => (
      <Tag tone={g.status === "deployed" ? "lime" : "neutral"}>
        {g.status === "deployed" ? "Deployed" : "Draft"}
      </Tag>
    ),
  },
];

export function GuardrailsTable() {
  const guardrails = useGuardrails();
  const { open } = useDrawerRoute();

  return (
    <Stack direction="column" gap={4} padding={6}>
      <Section title="Guardrails" headingLevel={2}>
        {guardrails.isPending ? (
          <Stack direction="column" gap={2}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : guardrails.isError ? (
          <ErrorState
            title="Could not load guardrails"
            onRetry={() => {
              void guardrails.refetch();
            }}
          />
        ) : (
          <DataTable
            ariaLabel="Guardrails"
            columns={COLUMNS}
            rows={guardrails.data}
            getRowId={(g) => g.id}
            getRowLabel={(g) => `Open ${g.name}`}
            onRowClick={(g) => {
              open(g.id);
            }}
            emptyState={<EmptyState title="No guardrails yet" />}
          />
        )}
      </Section>
    </Stack>
  );
}
