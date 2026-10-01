import { EmptyState, ErrorState, LineChart, MenuSelect, Section, Skeleton } from "@blast/components";
import type { LineChartSeries } from "@blast/components";
import type { ActivityRange } from "../../../domain/guardrail.types.js";
import { useActivities } from "../../../hooks/use-activities.js";
import { useDrawerRoute } from "../../../hooks/use-drawer-route.js";

const RANGE_OPTIONS: { value: ActivityRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const SERIES: LineChartSeries[] = [
  { key: "passed", label: "Passed", tone: "orange" },
  { key: "blocked", label: "Blocked", tone: "red" },
  { key: "excluded", label: "Excluded", tone: "indigo" },
];

const tickFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-09-15" → "SEP. 15" as in the design. */
export function formatTickDate(iso: string): string {
  const parts = tickFormat.formatToParts(new Date(`${iso}T00:00:00Z`));
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${month.toUpperCase()}. ${day}`;
}

function rangeLabel(range: ActivityRange) {
  return RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";
}

export function ActivitiesSection({ guardrailId }: { guardrailId: string }) {
  const { route, setRange } = useDrawerRoute();
  const activities = useActivities(guardrailId, route.range);

  return (
    <Section
      title="Activities"
      variant="card"
      actions={
        <MenuSelect
          ariaLabel="Activities range"
          value={route.range}
          options={RANGE_OPTIONS}
          size="sm"
          menuAlign="end"
          onChange={(value) => {
            const option = RANGE_OPTIONS.find((o) => o.value === value);
            if (option) setRange(option.value);
          }}
        />
      }
    >
      {activities.isPending ? (
        <Skeleton height={220} radius="md" />
      ) : activities.isError ? (
        <ErrorState
          title="Could not load activities"
          onRetry={() => {
            void activities.refetch();
          }}
        />
      ) : activities.data.length === 0 ? (
        <EmptyState title="No activity in this period" />
      ) : (
        <LineChart
          ariaLabel={`Guardrail activities, ${rangeLabel(route.range).toLowerCase()}`}
          data={activities.data.map((point) => ({ ...point }))}
          xKey="date"
          series={SERIES}
          yTickFormatter={(value) => `${String(value)}%`}
          xTickFormatter={formatTickDate}
          height={160}
        />
      )}
    </Section>
  );
}
