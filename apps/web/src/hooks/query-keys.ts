import type { ActivityRange, DefenseFilters, RowTab } from "../domain/guardrail.types.js";

export const guardrailKeys = {
  all: ["guardrails"] as const,
  list: () => [...guardrailKeys.all, "list"] as const,
  detail: (id: string) => [...guardrailKeys.all, "detail", id] as const,
  defense: (id: string, filters: DefenseFilters) =>
    [...guardrailKeys.detail(id), "defense", filters] as const,
  activities: (id: string, range: ActivityRange) =>
    [...guardrailKeys.detail(id), "activities", range] as const,
  tabRows: (id: string, tab: RowTab) => [...guardrailKeys.detail(id), "rows", tab] as const,
  cloudUnits: () => ["cloud-units"] as const,
};
